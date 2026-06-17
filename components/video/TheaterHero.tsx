"use client";

import { useState } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";

interface TheaterHeroProps {
  video: TheaterVideoItem;
  onOpen: (video: TheaterVideoItem) => void;
  /** Small label above the title; defaults to 精选, becomes 继续观看 for the last-played video. */
  eyebrow?: string;
}

export function TheaterHero({ video, onOpen, eyebrow = "精选" }: TheaterHeroProps) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="relative mb-8 h-[42vh] min-h-[300px] w-full overflow-hidden rounded-3xl ring-1 ring-white/10">
      {video.posterUrl && !imgFailed ? (
        <img
          src={video.posterUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

      <div className="relative flex h-full max-w-xl flex-col justify-end gap-3 p-6 sm:p-8">
        <span className="text-base font-black tracking-widest text-[var(--theater-accent)] sm:text-lg">
          {eyebrow} · {video.categoryTitle}
        </span>
        <h1 className="text-3xl font-black drop-shadow sm:text-5xl">{video.title}</h1>
        {video.summary && (
          <p className="line-clamp-2 text-base text-white/70 sm:text-lg">{video.summary}</p>
        )}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onOpen(video)}
            className="flex h-12 items-center gap-2 rounded-full bg-white px-6 font-black text-slate-900 shadow-lg transition hover:scale-105"
          >
            ▶ 播放
          </button>
          {!video.unlocked && (
            <span className="flex h-12 items-center gap-1 rounded-full bg-black/40 px-5 font-black text-amber-300 ring-1 ring-white/15 backdrop-blur">
              🔒 ⭐×{video.cost}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
