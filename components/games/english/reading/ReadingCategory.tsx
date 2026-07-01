"use client";

import { useState } from "react";
import { READING_STORIES } from "@/content/reading";
import { ReadingReader } from "./ReadingReader";

// 双语阅读 entry inside the English island. Shows the bookshelf of all ten classics; tapping an active
// story opens its reader, an inactive one is a friendly 「敬请期待」 card. In-page state (no route) to
// match the rest of EnglishHub (场景闯关 / 字母&音标).
export function ReadingCategory() {
  const [openId, setOpenId] = useState<string | null>(null);

  const open = openId ? READING_STORIES.find((e) => e.id === openId) : undefined;
  if (open?.story) {
    return <ReadingReader story={open.story} onBack={() => setOpenId(null)} />;
  }

  return (
    <div>
      <p className="mb-3 text-center text-sm font-bold text-slate-500">
        📖 双语小故事 · 听英文、看中文、跟着读
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {READING_STORIES.map((entry) => (
          <button
            key={entry.id}
            type="button"
            disabled={!entry.active}
            onClick={() => entry.active && setOpenId(entry.id)}
            className={`flex flex-col items-center gap-1 rounded-2xl p-4 text-center ring-1 transition ${
              entry.active
                ? "bg-white text-slate-800 ring-slate-100 shadow-sm hover:scale-[1.02] hover:ring-emerald-200"
                : "cursor-not-allowed bg-slate-50 text-slate-300 ring-slate-100"
            }`}
          >
            <span className="text-4xl">{entry.emoji}</span>
            <span className="text-sm font-black leading-tight">{entry.titleZh}</span>
            <span className="text-[11px] font-bold leading-tight opacity-70">{entry.titleEn}</span>
            {!entry.active && (
              <span className="mt-1 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                敬请期待
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
