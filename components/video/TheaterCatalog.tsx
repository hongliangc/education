"use client";

import { Btn } from "@/components/Btn";

export interface TheaterVideoItem {
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
  unlocked: boolean;
  searchKey?: string;
}

interface TheaterCatalogProps {
  videos: TheaterVideoItem[];
  loading: boolean;
  error: string | null;
  onOpen: (video: TheaterVideoItem) => void;
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "短片";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest}秒`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function TheaterCatalog({
  videos,
  loading,
  error,
  onOpen,
}: TheaterCatalogProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/4] animate-pulse rounded-3xl bg-white/5 ring-1 ring-white/10"
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

  if (videos.length === 0) {
    return (
      <div className="rounded-3xl bg-white/5 p-6 text-center ring-1 ring-white/10 backdrop-blur">
        <div className="mb-2 text-5xl">📁</div>
        <p className="text-lg font-bold text-white/90">视频库还是空的。</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {videos.map((video) => (
        <button
          key={video.id}
          type="button"
          onClick={() => onOpen(video)}
          className="group overflow-hidden rounded-3xl bg-white/5 text-left ring-1 ring-white/10 transition hover:-translate-y-1 hover:ring-white/30"
        >
          <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900">
            {video.posterUrl ? (
              <img
                src={video.posterUrl}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl opacity-80">🎞️</div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/80 via-black/25 to-transparent p-3">
              <span className="rounded-full bg-black/50 px-2 py-1 text-xs font-black text-white ring-1 ring-white/15 backdrop-blur">
                {formatDuration(video.durationSec)}
              </span>
              {(video.subject || video.ageBand) && (
                <span className="rounded-full bg-emerald-400/90 px-2 py-1 text-xs font-black text-emerald-950">
                  {video.subject ?? video.ageBand}
                </span>
              )}
            </div>
            {!video.unlocked && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-sm font-black text-amber-300 ring-1 ring-white/15 backdrop-blur">
                <span aria-hidden="true">🔒</span>
                <span>⭐×{video.cost}</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <h2 className="line-clamp-2 min-h-10 text-base font-black text-white">
              {video.title}
            </h2>
            {video.summary ? (
              <p className="mt-1 line-clamp-2 text-xs font-bold text-white/50">
                {video.summary}
              </p>
            ) : video.resolution ? (
              <p className="mt-1 text-xs font-bold text-white/40">{video.resolution}</p>
            ) : null}
            {video.subject && video.ageBand && (
              <p className="mt-2 inline-flex rounded-full bg-sky-400/15 px-2 py-1 text-xs font-black text-sky-300">
                {video.ageBand}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
