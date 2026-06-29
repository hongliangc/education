"use client";
import type { Chapter } from "@/content/storybooks/types";

export function StoryCardRow({
  chapters,
  unlockedThrough,
  onPick,
}: {
  chapters: Chapter[];
  unlockedThrough: number; // 已通关章节数：idx <= unlockedThrough 可读
  onPick: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {chapters.map((c) => {
        const locked = c.idx > unlockedThrough;
        return (
          <button
            key={c.idx}
            disabled={locked}
            onClick={() => onPick(c.idx)}
            className={
              "rounded-2xl p-4 text-left shadow ring-1 ring-white transition " +
              (locked ? "bg-white/40 opacity-60" : "bg-[#F3ECDA] hover:scale-105")
            }
            aria-label={locked ? `${c.title}（未解锁）` : `读 ${c.title}`}
          >
            <div className="text-3xl">{locked ? "🔒" : c.emoji}</div>
            <div className="mt-1 font-history text-base text-[#2B2622]">
              第{c.idx + 1}回 · {c.title}
            </div>
          </button>
        );
      })}
    </div>
  );
}
