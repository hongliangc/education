"use client";

import { useEffect, useMemo, useState } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";
import { compareEpisodes, episodeNumber } from "@/lib/video/episode-order";

export interface TheaterCategory {
  key: string;
  title: string;
  order: number;
  videos: TheaterVideoItem[];
  coverUrl?: string;
}

function groupByCategory(videos: TheaterVideoItem[]): TheaterCategory[] {
  const groups = new Map<string, TheaterCategory>();
  for (const video of videos) {
    let group = groups.get(video.category);
    if (!group) {
      group = {
        key: video.category,
        title: video.categoryTitle,
        order: video.categoryOrder,
        videos: [],
      };
      groups.set(video.category, group);
    }
    group.videos.push(video);
  }

  // Episodes within a collection sort by their number ascending (第1集 → 第2集 …);
  // un-numbered items (e.g. movies) keep their curated/listing order then collation.
  const sortVideos = (a: TheaterVideoItem, b: TheaterVideoItem) => {
    if (episodeNumber(a.title) !== null || episodeNumber(b.title) !== null) {
      return compareEpisodes(a.title, b.title);
    }
    return a.order - b.order || a.title.localeCompare(b.title, "zh-CN");
  };

  const categories = [...groups.values()];
  for (const group of categories) {
    group.videos.sort(sortVideos);
    group.coverUrl = group.videos.find((video) => video.posterUrl)?.posterUrl;
  }
  categories.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title, "zh-CN"));
  return categories;
}

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

  const categories = useMemo(() => groupByCategory(videos), [videos]);

  return { categories, setVideos, loading, error };
}
