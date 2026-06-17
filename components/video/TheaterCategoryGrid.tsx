"use client";

import { Btn } from "@/components/Btn";
import type { TheaterCategory } from "@/components/video/useTheaterCatalog";

interface TheaterCategoryGridProps {
  categories: TheaterCategory[];
  loading: boolean;
  error: string | null;
  onOpen: (categoryKey: string) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  动画: "🎬",
  英语: "🔤",
  科普: "🔬",
  数学: "🔢",
  音乐: "🎵",
  故事: "📖",
};

function emojiFor(title: string): string {
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (title.includes(key)) return emoji;
  }
  return "🎞️";
}

export function TheaterCategoryGrid({
  categories,
  loading,
  error,
  onOpen,
}: TheaterCategoryGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/10"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10 backdrop-blur">
        <div className="mb-2 text-5xl">☁️</div>
        <p className="mb-4 text-lg font-bold text-white/90">{error}</p>
        <Btn variant="secondary" onClick={() => window.location.reload()}>
          再试一次
        </Btn>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10 backdrop-blur">
        <div className="mb-2 text-5xl">📁</div>
        <p className="text-lg font-bold text-white/90">视频库还是空的。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {categories.map((category) => (
        <button
          key={category.key}
          type="button"
          onClick={() => onOpen(category.key)}
          className="group relative overflow-hidden rounded-3xl bg-white/5 text-left ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-white/30"
        >
          <div className="relative aspect-[4/3] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
            {category.coverUrl ? (
              <img
                src={category.coverUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-80">
                {emojiFor(category.title)}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3">
              <h2 className="text-lg font-black text-white drop-shadow sm:text-xl">
                <span className="mr-1" aria-hidden="true">
                  {emojiFor(category.title)}
                </span>
                {category.title}
              </h2>
              <span className="rounded-full bg-black/50 px-2 py-1 text-xs font-black text-white ring-1 ring-white/15 backdrop-blur">
                {category.videos.length} 部
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
