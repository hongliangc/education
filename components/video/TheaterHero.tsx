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
    <div className="relative mb-6 h-[48vh] min-h-[260px] w-full overflow-hidden rounded-2xl ring-1 ring-white/10 sm:mb-8 sm:h-[42vh] sm:min-h-[300px] sm:rounded-3xl">
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

      <div className="relative flex h-full max-w-xl flex-col justify-end gap-2 p-4 sm:gap-3 sm:p-8">
        <span className="text-sm font-black tracking-widest text-[var(--theater-accent)] sm:text-lg">
          {eyebrow} · {video.categoryTitle}
        </span>
        <h1 className="line-clamp-2 text-2xl font-black leading-tight text-white drop-shadow sm:text-5xl">{video.title}</h1>
        {video.summary && (
          <p className="line-clamp-2 text-sm text-white/70 sm:text-lg">{video.summary}</p>
        )}
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onOpen(video)}
            className="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-900 shadow-lg transition hover:scale-105 sm:h-12 sm:px-6 sm:text-base"
          >
            ▶ 播放
          </button>
          {!video.unlocked && (
            <span className="flex h-11 items-center gap-1 rounded-full bg-black/40 px-4 text-sm font-black text-amber-300 ring-1 ring-white/15 backdrop-blur sm:h-12 sm:px-5 sm:text-base">
              🔒 ⭐×{video.cost}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
