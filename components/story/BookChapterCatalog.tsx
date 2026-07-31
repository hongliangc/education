"use client";

import { Btn } from "@/components/Btn";
import Image from "next/image";
import type { StoryBook } from "@/content/storybooks/types";
import { chapterUnlockState } from "@/lib/rewards/client";

type ChapterView = ReturnType<typeof chapterUnlockState>;

export function BookChapterCatalog({ book, balance, notice, completed, lastIdx, viewFor, onChapter }: { book: StoryBook; balance: number; notice: string | null; completed: number; lastIdx: number; viewFor: (index: number) => ChapterView; onChapter: (index: number) => void }) {
  const total = book.chapters.length;

  return (
    <div className="rounded-3xl bg-white/85 p-5 shadow-xl ring-1 ring-white/60 backdrop-blur">
      <div className="text-center">
        <div className="relative mx-auto h-28 w-full max-w-sm overflow-hidden rounded-2xl bg-sky-100">
          <Image src={book.cover ?? "/ui/story/storybook-hero-v1.png"} alt="" fill sizes="384px" className="object-cover" />
        </div>
        <h1 className="mt-2 text-2xl font-bold text-slate-700">{book.title}</h1>
        {book.author && <p className="mt-1 text-xs text-slate-400">{book.author}</p>}
        <p className="mt-1 text-sm font-bold text-amber-500">⭐ {balance}</p>
      </div>
      {notice && <p className="anim-slide-up mt-3 rounded-2xl bg-amber-50 px-4 py-2 text-center text-sm font-bold text-amber-600 ring-1 ring-amber-200">{notice}</p>}
      {total > 1 && <Btn variant="primary" className="mt-4 w-full" onClick={() => onChapter(lastIdx)}>{completed === 0 ? "开始阅读 ▶" : `继续阅读 · 第 ${lastIdx + 1} 章 ▶`}</Btn>}
      <div className="mt-4 space-y-2">
        {book.chapters.map((chapter) => {
          const view = viewFor(chapter.idx);
          const done = chapter.idx < completed;
          const current = chapter.idx === lastIdx;
          return (
            <button key={chapter.idx} onClick={() => onChapter(chapter.idx)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-slate-700 ring-1 transition hover:bg-purple-50 ${current ? "bg-purple-50 ring-purple-300" : "bg-white ring-slate-200"} ${view.kind === "locked" ? "opacity-60" : ""}`}>
              <span className="text-2xl">{view.kind === "locked" ? "🔒" : chapter.emoji}</span>
              <span className="flex-1 font-bold">{total > 1 ? `第 ${chapter.idx + 1} 章 · ` : ""}{chapter.title}</span>
              {done && <span className="text-emerald-500">✓</span>}
              {view.kind !== "unlocked" && <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${view.kind === "free" ? "bg-emerald-100 text-emerald-600" : view.kind === "affordable" ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}>{view.label}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
