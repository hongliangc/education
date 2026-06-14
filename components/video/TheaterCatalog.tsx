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
  unlocked: boolean;
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
            className="aspect-[3/4] animate-pulse rounded-3xl bg-white/55 shadow ring-1 ring-white/60"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center shadow-xl ring-1 ring-white">
        <div className="mb-2 text-5xl">☁️</div>
        <p className="mb-4 text-lg font-bold text-slate-700">{error}</p>
        <Btn variant="secondary" onClick={() => window.location.reload()}>
          再试一次
        </Btn>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-3xl bg-white/90 p-6 text-center shadow-xl ring-1 ring-white">
        <div className="mb-2 text-5xl">📁</div>
        <p className="text-lg font-bold text-slate-700">视频库还是空的。</p>
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
          className="group overflow-hidden rounded-3xl bg-white/90 text-left shadow-xl ring-1 ring-white transition hover:-translate-y-1 hover:shadow-2xl"
        >
          <div className="relative aspect-[3/4] bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-100">
            {video.posterUrl ? (
              <img
                src={video.posterUrl}
                alt=""
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">🎞️</div>
            )}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
              <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-black text-slate-700">
                {formatDuration(video.durationSec)}
              </span>
              {(video.subject || video.ageBand) && (
                <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-black text-emerald-950">
                  {video.subject ?? video.ageBand}
                </span>
              )}
            </div>
            {!video.unlocked && (
              <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-slate-950/75 px-3 py-1 text-sm font-black text-white shadow">
                <span aria-hidden="true">🔒</span>
                <span>⭐×{video.cost}</span>
              </div>
            )}
          </div>
          <div className="p-3">
            <h2 className="line-clamp-2 min-h-10 text-base font-black text-slate-700">
              {video.title}
            </h2>
            {video.summary ? (
              <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">
                {video.summary}
              </p>
            ) : video.resolution ? (
              <p className="mt-1 text-xs font-bold text-slate-400">{video.resolution}</p>
            ) : null}
            {video.subject && video.ageBand && (
              <p className="mt-2 inline-flex rounded-full bg-sky-100 px-2 py-1 text-xs font-black text-sky-700">
                {video.ageBand}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
