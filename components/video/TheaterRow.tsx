"use client";

import { useRef } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";
import { TheaterPosterCard } from "@/components/video/TheaterPosterCard";

interface TheaterRowProps {
  title: string;
  videos: TheaterVideoItem[];
  onOpen: (video: TheaterVideoItem) => void;
  onSeeAll: () => void;
}

const chevron =
  "hidden h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xl ring-1 ring-white/15 backdrop-blur transition hover:bg-white/20 sm:flex";

export function TheaterRow({ title, videos, onOpen, onSeeAll }: TheaterRowProps) {
  const scroller = useRef<HTMLDivElement>(null);
  if (videos.length === 0) return null;

  const scrollByPage = (direction: number) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <section>
      <div className="mb-2 flex items-center gap-1.5 sm:gap-2">
        <h2 className="min-w-0 flex-1 truncate text-base font-black text-white sm:text-2xl">{title}</h2>
        <span className="shrink-0 text-xs font-bold text-[var(--theater-accent)] sm:text-lg">
          {videos.length} 部
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => scrollByPage(-1)} aria-label="向左滚动" className={chevron}>
            ‹
          </button>
          <button type="button" onClick={() => scrollByPage(1)} aria-label="向右滚动" className={chevron}>
            ›
          </button>
          <button
            type="button"
            onClick={onSeeAll}
            className="ml-1 shrink-0 text-xs font-bold text-[var(--theater-accent)] transition hover:opacity-80 sm:text-lg"
          >
            全部 ›
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex snap-x gap-2 overflow-x-auto scroll-smooth pb-1 sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {videos.map((video) => (
          <TheaterPosterCard
            key={video.id}
            video={video}
            onOpen={onOpen}
            className="w-[44vw] shrink-0 snap-start sm:w-64"
          />
        ))}
      </div>
    </section>
  );
}
