"use client";

import { useEffect, useMemo, useState } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";
import type { TheaterCategory } from "@/components/video/useTheaterCatalog";
import { TheaterHero } from "@/components/video/TheaterHero";
import { TheaterRow } from "@/components/video/TheaterRow";
import { TheaterPosterCard } from "@/components/video/TheaterPosterCard";
import { filterVideos, pickFeatured } from "@/lib/video/search";
import { readLastPlayedId } from "@/lib/video/recent-storage";

interface TheaterBrowseProps {
  categories: TheaterCategory[];
  loading: boolean;
  error: string | null;
  query: string;
  activeCategory: string | null;
  onActiveCategoryChange: (key: string | null) => void;
  onOpen: (video: TheaterVideoItem) => void;
}

function PosterGrid({
  videos,
  onOpen,
  emptyText,
}: {
  videos: TheaterVideoItem[];
  onOpen: (video: TheaterVideoItem) => void;
  emptyText: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="rounded-3xl bg-white/5 p-10 text-center text-white/60 ring-1 ring-white/10 backdrop-blur">
        {emptyText}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <TheaterPosterCard key={video.id} video={video} onOpen={onOpen} className="w-full" />
      ))}
    </div>
  );
}

export function TheaterBrowse({
  categories,
  loading,
  error,
  query,
  activeCategory,
  onActiveCategoryChange,
  onOpen,
}: TheaterBrowseProps) {
  const [lastPlayedId, setLastPlayedId] = useState<string | null>(null);

  // Read on mount only: localStorage is client-only and we want the hero to reflect
  // the last play even after a remount, but not to flip mid-session while browsing.
  useEffect(() => setLastPlayedId(readLastPlayedId()), []);

  const allVideos = useMemo(() => categories.flatMap((c) => c.videos), [categories]);
  const results = useMemo(() => filterVideos(allVideos, query), [allVideos, query]);
  const featured = useMemo(() => pickFeatured(allVideos), [allVideos]);
  const lastPlayed = useMemo(
    () => (lastPlayedId ? allVideos.find((v) => v.id === lastPlayedId) ?? null : null),
    [allVideos, lastPlayedId],
  );
  const hero = lastPlayed ?? featured;
  const activeCat = activeCategory
    ? categories.find((c) => c.key === activeCategory) ?? null
    : null;

  return (
    <div>
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video animate-pulse rounded-xl bg-white/5 ring-1 ring-white/10" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-white/5 p-10 text-center text-lg font-bold text-white/80 ring-1 ring-white/10 backdrop-blur">
          ☁️ {error}
        </div>
      ) : query.trim() ? (
        <PosterGrid videos={results} onOpen={onOpen} emptyText={`没有匹配「${query.trim()}」的视频`} />
      ) : activeCat ? (
        <PosterGrid videos={activeCat.videos} onOpen={onOpen} emptyText="这个分类还没有视频。" />
      ) : allVideos.length === 0 ? (
        <div className="rounded-3xl bg-white/5 p-10 text-center text-lg font-bold text-white/80 ring-1 ring-white/10 backdrop-blur">
          📁 视频库还是空的。
        </div>
      ) : (
        <>
          {hero && (
            <TheaterHero
              video={hero}
              onOpen={onOpen}
              eyebrow={lastPlayed ? "继续观看" : "精选"}
            />
          )}
          <div className="space-y-8">
            {categories.map((category) => (
              <TheaterRow
                key={category.key}
                title={category.title}
                videos={category.videos}
                onOpen={onOpen}
                onSeeAll={() => onActiveCategoryChange(category.key)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
