import "server-only";

import { pinyin } from "pinyin-pro";
import { getOpenListClient } from "@/lib/openlist/client";
import {
  buildVideoCatalog,
  OpenListCatalogError,
  type CategoryListing,
  type OpenListVideoEntry,
} from "@/lib/video/openlist-catalog";

export { OpenListCatalogError };
export type { OpenListVideoEntry };

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
  category: string;
  categoryTitle: string;
  categoryOrder: number;
  searchKey?: string;
}

interface CachedCatalog {
  expiresAt: number;
  entries: OpenListVideoEntry[];
}

let cachedCatalog: CachedCatalog | null = null;
let catalogPromise: Promise<OpenListVideoEntry[]> | null = null;

function required(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new OpenListCatalogError(`${name} is not configured`);
  return value;
}

function ttlMs(): number {
  const value = Number(process.env.OPENLIST_CATALOG_TTL_SEC || 600);
  return Number.isFinite(value) && value > 0 ? value * 1000 : 600_000;
}

function joinPath(root: string, name: string): string {
  return root === "/" ? `/${name}` : `${root}/${name}`;
}

function baseName(path: string): string {
  const segments = path.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? path;
}

/** Run async work with a fixed worker pool so we never burst the upstream rate limit. */
async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function run(): Promise<void> {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => run()),
  );
  return results;
}

/** Pinyin (full + initials) so the client can match e.g. "dhdy" → 动画电影. */
function buildSearchKey(title: string, categoryTitle: string): string {
  const text = `${title} ${categoryTitle}`;
  const full = pinyin(text, { toneType: "none", type: "array" }).join("");
  const initials = pinyin(text, { pattern: "first", toneType: "none", type: "array" }).join("");
  return `${full} ${initials}`.toLowerCase();
}

function publicItem(entry: OpenListVideoEntry): VideoItem {
  const hasPoster = Boolean(entry.posterPath || entry.thumbUrl);
  return {
    id: entry.id,
    title: entry.title,
    posterUrl: hasPoster ? `/api/videos/${encodeURIComponent(entry.id)}/poster` : undefined,
    durationSec: entry.durationSec,
    resolution: entry.resolution,
    ageBand: entry.ageBand,
    subject: entry.subject,
    summary: entry.summary,
    order: entry.order,
    cost: entry.cost,
    category: entry.category,
    categoryTitle: entry.categoryTitle,
    categoryOrder: entry.categoryOrder,
    searchKey: buildSearchKey(entry.title, entry.categoryTitle),
  };
}

async function loadCatalog(): Promise<OpenListVideoEntry[]> {
  const client = getOpenListClient();
  const videoRoot = required("OPENLIST_VIDEO_ROOT", "/");
  const catalogName = baseName(process.env.OPENLIST_CATALOG_FILE?.trim() || "catalog.json");

  const rootFiles = await client.list(videoRoot);
  const categoryFolders = rootFiles.filter((file) => file.isDir).map((file) => file.name);

  // Bounded concurrency keeps us under the upstream list quota; a folder that fails
  // to list (e.g. transient rate limit) is treated as empty and recovers next refresh.
  const listings: CategoryListing[] = await mapWithConcurrency(
    categoryFolders,
    4,
    async (category) => {
      try {
        return { category, files: await client.list(joinPath(videoRoot, category)) };
      } catch {
        return { category, files: [] };
      }
    },
  );

  // catalog.json is optional: only read it when it exists at the video root.
  const hasCatalog = rootFiles.some((file) => !file.isDir && file.name === catalogName);
  const overridesContent = hasCatalog
    ? await client.getText(joinPath(videoRoot, catalogName))
    : undefined;

  const entries = buildVideoCatalog(videoRoot, listings, overridesContent);
  cachedCatalog = { expiresAt: Date.now() + ttlMs(), entries };
  return entries;
}

async function getCatalogEntries(forceRefresh = false): Promise<OpenListVideoEntry[]> {
  if (!forceRefresh && cachedCatalog && cachedCatalog.expiresAt > Date.now()) {
    return cachedCatalog.entries;
  }
  catalogPromise ??= loadCatalog().finally(() => {
    catalogPromise = null;
  });
  return catalogPromise;
}

export async function getVideoCatalog(forceRefresh = false): Promise<VideoItem[]> {
  return (await getCatalogEntries(forceRefresh)).map(publicItem);
}

export async function getVideoSource(id: string): Promise<OpenListVideoEntry | undefined> {
  return (await getCatalogEntries()).find((entry) => entry.id === id);
}

// --- Fresh per-folder thumbnails ---------------------------------------------
// Aliyun thumb URLs are OSS-signed and live only ~15 min, and OpenList's cached
// listing (refresh:false, used to build the catalog structure) routinely returns
// an ALREADY-expired thumb. So poster requests resolve the thumb from a forced
// refresh:true listing instead, cached briefly per folder so a page full of
// tiles in one category triggers a single re-list (lazy loading spreads the rest).
interface FolderThumbs {
  expiresAt: number;
  thumbs: Map<string, string>;
}
const folderThumbCache = new Map<string, FolderThumbs>();
const folderThumbPromise = new Map<string, Promise<Map<string, string>>>();

function thumbTtlMs(): number {
  const value = Number(process.env.OPENLIST_THUMB_TTL_SEC || 180);
  return Number.isFinite(value) && value > 0 ? value * 1000 : 180_000;
}

async function freshFolderThumbs(dir: string): Promise<Map<string, string>> {
  const cached = folderThumbCache.get(dir);
  if (cached && cached.expiresAt > Date.now()) return cached.thumbs;
  let pending = folderThumbPromise.get(dir);
  if (!pending) {
    pending = (async () => {
      const files = await getOpenListClient().list(dir, true);
      const thumbs = new Map<string, string>();
      for (const file of files) {
        if (!file.isDir && file.thumb) thumbs.set(file.name, file.thumb);
      }
      folderThumbCache.set(dir, { expiresAt: Date.now() + thumbTtlMs(), thumbs });
      return thumbs;
    })().finally(() => folderThumbPromise.delete(dir));
    folderThumbPromise.set(dir, pending);
  }
  return pending;
}

/** Re-sign a live thumbnail URL for one video; the catalog thumbUrl is only a presence hint. */
export async function getFreshThumbUrl(entry: OpenListVideoEntry): Promise<string | undefined> {
  const slash = entry.sourcePath.lastIndexOf("/");
  if (slash <= 0) return undefined;
  const dir = entry.sourcePath.slice(0, slash);
  const name = entry.sourcePath.slice(slash + 1);
  const thumbs = await freshFolderThumbs(dir);
  return thumbs.get(name);
}
