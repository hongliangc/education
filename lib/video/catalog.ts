import "server-only";

import {
  AliyunApiError,
  getAliyunDownloadUrl,
  listAliyunFiles,
  type AliyunOpenFile,
} from "@/lib/aliyun/client";
import { resolveVideoCost } from "@/lib/video/unlock";

const CATALOG_TTL_MS = 10 * 60 * 1000;
const VIDEO_EXTENSIONS = new Set(["mp4", "mkv", "mov", "m4v", "webm", "avi", "ts"]);
const POSTER_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export interface VideoItem {
  id: string;
  title: string;
  posterUrl?: string;
  durationSec?: number;
  resolution?: string;
  ageBand?: string;
  subject?: string;
  summary?: string;
  order: number;
  cost: number;
}

interface CatalogOverride {
  id?: string;
  file?: string;
  name?: string;
  title?: string;
  order?: number;
  ageBand?: string;
  age_band?: string;
  subject?: string;
  summary?: string;
  poster?: string;
  cost?: unknown;
}

interface CachedCatalog {
  expiresAt: number;
  items: VideoItem[];
}

let cachedCatalog: CachedCatalog | null = null;

function getFolderId(): string {
  const folderId = process.env.ALIYUN_VIDEO_FOLDER_ID?.trim();
  if (!folderId) {
    throw new AliyunApiError("ALIYUN_VIDEO_FOLDER_ID is not configured", 503);
  }
  return folderId;
}

function getExtension(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(index + 1).toLowerCase() : "";
}

function getBaseName(name: string): string {
  const index = name.lastIndexOf(".");
  return index >= 0 ? name.slice(0, index) : name;
}

function isVideoFile(file: AliyunOpenFile): boolean {
  const extension = file.file_extension?.toLowerCase() || getExtension(file.name);
  return file.category === "video" || VIDEO_EXTENSIONS.has(extension);
}

function isPosterFile(file: AliyunOpenFile): boolean {
  const extension = file.file_extension?.toLowerCase() || getExtension(file.name);
  return file.category === "image" || POSTER_EXTENSIONS.has(extension);
}

function durationToSeconds(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value >= 0 ? Math.round(value) : undefined;
  }
  if (typeof value === "string") {
    const num = Number(value);
    if (Number.isFinite(num)) return durationToSeconds(num);
  }
  return undefined;
}

function fileResolution(file: AliyunOpenFile): string | undefined {
  const width = file.video_media_metadata?.width;
  const height = file.video_media_metadata?.height;
  return width && height ? `${width}x${height}` : undefined;
}

async function loadCatalogOverrides(catalogFile: AliyunOpenFile | undefined) {
  if (!catalogFile) return new Map<string, CatalogOverride>();

  try {
    const { url } = await getAliyunDownloadUrl(catalogFile.file_id);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return new Map<string, CatalogOverride>();
    const json = (await res.json()) as unknown;
    const list = Array.isArray(json)
      ? json
      : typeof json === "object" && json !== null && Array.isArray((json as { videos?: unknown }).videos)
        ? (json as { videos: unknown[] }).videos
        : [];

    const overrides = new Map<string, CatalogOverride>();
    for (const item of list) {
      if (typeof item !== "object" || item === null) continue;
      const override = item as CatalogOverride;
      const key = override.id ?? override.file ?? override.name;
      if (key) overrides.set(key, override);
    }
    return overrides;
  } catch {
    return new Map<string, CatalogOverride>();
  }
}

async function posterUrlFor(video: AliyunOpenFile, poster: AliyunOpenFile | undefined) {
  if (poster?.thumbnail) return poster.thumbnail;
  if (poster) {
    try {
      return (await getAliyunDownloadUrl(poster.file_id)).url;
    } catch {
      return undefined;
    }
  }
  return video.thumbnail;
}

function compareVideoItems(a: VideoItem, b: VideoItem): number {
  if (a.order !== b.order) return a.order - b.order;
  return a.title.localeCompare(b.title, "zh-CN");
}

export async function getVideoCatalog(forceRefresh = false): Promise<VideoItem[]> {
  if (!forceRefresh && cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.items;
  }

  const files = await listAliyunFiles(getFolderId());
  const catalogFile = files.find((file) => file.name.toLowerCase() === "catalog.json");
  const overrides = await loadCatalogOverrides(catalogFile);
  const postersByBase = new Map(
    files.filter(isPosterFile).map((file) => [getBaseName(file.name).toLowerCase(), file]),
  );

  const videoFiles = files.filter(isVideoFile);
  const items = await Promise.all(
    videoFiles.map(async (file, index): Promise<VideoItem> => {
      const baseName = getBaseName(file.name);
      const override =
        overrides.get(file.file_id) ?? overrides.get(file.name) ?? overrides.get(baseName);
      const poster = override?.poster
        ? files.find((candidate) => candidate.name === override.poster)
        : postersByBase.get(baseName.toLowerCase());

      return {
        id: file.file_id,
        title: override?.title ?? baseName,
        posterUrl: await posterUrlFor(file, poster),
        durationSec: durationToSeconds(file.video_media_metadata?.duration),
        resolution: fileResolution(file),
        ageBand: override?.ageBand ?? override?.age_band,
        subject: override?.subject,
        summary: override?.summary,
        order: override?.order ?? index + 1,
        cost: resolveVideoCost(override?.cost),
      };
    }),
  );

  const sortedItems = items.toSorted(compareVideoItems);
  cachedCatalog = {
    expiresAt: Date.now() + CATALOG_TTL_MS,
    items: sortedItems,
  };

  return sortedItems;
}
