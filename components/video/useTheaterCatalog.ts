"use client";

import { useEffect, useMemo, useState } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";

export function useTheaterCatalog(childId: string | undefined) {
  const [videos, setVideos] = useState<TheaterVideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!childId) return;
    const activeChildId = childId;
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/videos?childId=${encodeURIComponent(activeChildId)}`);
        if (!res.ok) throw new Error("catalog_failed");
        const json = (await res.json()) as { videos?: TheaterVideoItem[] };
        if (!cancelled) setVideos(json.videos ?? []);
      } catch {
        if (!cancelled) setError("视频暂时看不了，等一下再试试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVideos();
    return () => {
      cancelled = true;
    };
  }, [childId]);

  const sortedVideos = useMemo(
    () =>
      videos.toSorted(
        (a, b) => a.order - b.order || a.title.localeCompare(b.title, "zh-CN"),
      ),
    [videos],
  );

  return { sortedVideos, setVideos, loading, error };
}
