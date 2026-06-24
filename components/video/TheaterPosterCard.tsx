"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";

interface TheaterPosterCardProps {
  video: TheaterVideoItem;
  onOpen: (video: TheaterVideoItem) => void;
  className?: string;
}

export function TheaterPosterCard({ video, onOpen, className }: TheaterPosterCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(video.posterUrl) && !imgFailed;

  return (
    <button type="button" onClick={() => onOpen(video)} className={cn("group block text-left", className)}>
      <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-800 ring-1 ring-white/10 transition duration-300 group-hover:ring-white/40">
        {showImage ? (
          <img
            src={video.posterUrl}
            alt=""
            loading="lazy"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl opacity-70">🎞️</div>
        )}

        {!video.unlocked && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs font-black text-amber-300 ring-1 ring-white/15 backdrop-blur sm:px-2.5 sm:py-1 sm:text-base">
            <span aria-hidden="true">🔒</span>
            <span>⭐×{video.cost}</span>
          </div>
        )}
      </div>

      <p className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug text-white/90 transition group-hover:text-white sm:mt-2 sm:text-lg">
        {video.title}
      </p>
    </button>
  );
}
