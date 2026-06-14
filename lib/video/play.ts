import "server-only";

import { getOpenListClient, type OpenListPlayInfo } from "@/lib/openlist/client";

interface CachedPlay {
  expiresAt: number;
  play: OpenListPlayInfo;
}

const playCache = new Map<string, CachedPlay>();
const playPromises = new Map<string, Promise<OpenListPlayInfo>>();

function playCacheTtlMs(): number {
  const value = Number(process.env.OPENLIST_PLAY_CACHE_TTL_SEC || 600);
  return Number.isFinite(value) && value > 0 ? value * 1000 : 600_000;
}

export async function getOpenListVideoPlayInfo(
  sourcePath: string,
  forceRefresh = false,
): Promise<OpenListPlayInfo> {
  const quality = process.env.OPENLIST_MAX_VIDEO_QUALITY?.trim() || "FHD";
  const key = `${quality}:${sourcePath}`;
  if (forceRefresh) playCache.delete(key);

  const cached = playCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.play;

  const existing = playPromises.get(key);
  if (existing) return existing;

  const promise = getOpenListClient()
    .getVideoPreview(sourcePath, quality)
    .then((play) => {
      playCache.set(key, {
        expiresAt: Date.now() + playCacheTtlMs(),
        play,
      });
      return play;
    })
    .finally(() => {
      playPromises.delete(key);
    });
  playPromises.set(key, promise);
  return promise;
}
