import "server-only";

import { getOpenListClient } from "@/lib/openlist/client";
import {
  OpenListCatalogError,
  parseOpenListCatalog,
  type OpenListCatalogItem,
} from "@/lib/video/openlist-catalog";

export { OpenListCatalogError };

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

interface CachedCatalog {
  expiresAt: number;
  entries: OpenListCatalogItem[];
}

let cachedCatalog: CachedCatalog | null = null;
let catalogPromise: Promise<OpenListCatalogItem[]> | null = null;

function required(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) throw new OpenListCatalogError(`${name} is not configured`);
  return value;
}

function ttlMs(): number {
  const value = Number(process.env.OPENLIST_CATALOG_TTL_SEC || 600);
  return Number.isFinite(value) && value > 0 ? value * 1000 : 600_000;
}

function publicItem(entry: OpenListCatalogItem): VideoItem {
  return {
    id: entry.id,
    title: entry.title,
    posterUrl: entry.posterUrl,
    durationSec: entry.durationSec,
    resolution: entry.resolution,
    ageBand: entry.ageBand,
    subject: entry.subject,
    summary: entry.summary,
    order: entry.order,
    cost: entry.cost,
  };
}

async function loadCatalog(): Promise<OpenListCatalogItem[]> {
  const client = getOpenListClient();
  const videoRoot = required("OPENLIST_VIDEO_ROOT", "/");
  const catalogPath = required("OPENLIST_CATALOG_FILE", `${videoRoot}/catalog.json`);
  const [files, content] = await Promise.all([
    client.list(videoRoot),
    client.getText(catalogPath),
  ]);
  const availableFiles = new Set(
    files.filter((file) => !file.isDir).map((file) => file.name),
  );
  const entries = parseOpenListCatalog(content, videoRoot, availableFiles).toSorted(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title, "zh-CN"),
  );
  cachedCatalog = {
    expiresAt: Date.now() + ttlMs(),
    entries,
  };
  return entries;
}

async function getCatalogEntries(forceRefresh = false): Promise<OpenListCatalogItem[]> {
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

export async function getVideoSource(
  id: string,
): Promise<OpenListCatalogItem | undefined> {
  return (await getCatalogEntries()).find((entry) => entry.id === id);
}
