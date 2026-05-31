// app/(game)/story/[bookId]/page.tsx
"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { Btn } from "@/components/Btn";
import { getBook } from "@/lib/content/storybooks";
import type { SessionResult } from "@/components/games/types";
import { ChapterReader } from "@/components/games/story/ChapterReader";

export default function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const bumpStars = useGameStore((s) => s.bumpStars);
  const { sfx } = useSFX();
  const book = getBook(bookId);

  // 顺序解锁上界：completedChapters（0..completedChapters 可点；之后锁）
  const [completed, setCompleted] = useState(0);
  const [lastIdx, setLastIdx] = useState(0);
  const [reading, setReading] = useState<number | null>(null);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      const res = await fetch(`/api/reading/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        const p = (j.progress ?? []).find(
          (x: { bookId: string }) => x.bookId === bookId,
        );
        if (p) {
          setCompleted(p.completedChapters ?? 0);
          setLastIdx(p.lastChapterIdx ?? 0);
        }
      }
    })();
  }, [child, bookId, router]);

  if (!child) return null;
  if (!book) {
    return (
      <main className="min-h-screen pt-20 px-4">
        <div className="max-w-md mx-auto rounded-3xl bg-white/85 p-6 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-2 font-bold text-slate-700">找不到这本书</p>
          <Btn variant="primary" className="mt-4" onClick={() => router.push("/story")}>
            回书架
          </Btn>
        </div>
      </main>
    );
  }

  const total = book.chapters.length;

  const onChapterComplete = async (idx: number, r: SessionResult) => {
    bumpStars(r.starsEarned);
    const newCompleted = Math.max(completed, idx + 1);
    const newLast = Math.min(idx + 1, total - 1);
    const finished = idx + 1 >= total;
    setCompleted(newCompleted);
    setLastIdx(newLast);
    setReading(null);
    // 记成绩（复用 sessions）+ 写阅读进度（reading）
    try {
      await Promise.all([
        fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ childId: child.id, module: "STORY", ...r }),
        }),
        fetch(`/api/reading/${child.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            lastChapterIdx: newLast,
            completedChapters: newCompleted,
            finished,
          }),
        }),
      ]);
    } catch {
      // 网络失败：本地状态已更新，读书优先，不阻断
    }
  };

  // —— 正在读某章 ——
  if (reading !== null) {
    const chapter = book.chapters[reading];
    return (
      <main className="min-h-screen pt-20 px-4 pb-10">
        <div className="max-w-2xl mx-auto rounded-3xl bg-white/90 backdrop-blur p-5 shadow-xl ring-1 ring-white/60">
          <ChapterReader
            key={chapter.idx}
            chapter={chapter}
            onChapterComplete={(r) => onChapterComplete(chapter.idx, r)}
          />
          <div className="mt-4 text-center">
            <Btn variant="secondary" onClick={() => { sfx.click(); setReading(null); }}>
              ← 返回目录
            </Btn>
          </div>
        </div>
      </main>
    );
  }

  // —— 章节目录 ——
  const openChapter = (idx: number) => {
    if (idx > completed) return; // 锁定
    sfx.pageFlip();
    setReading(idx);
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/story")} className="text-white/90 text-sm mb-3">
          ← 书架
        </button>
        <div className="rounded-3xl bg-white/85 backdrop-blur p-5 shadow-xl ring-1 ring-white/60">
          <div className="text-center">
            <div className="text-6xl">{book.emoji}</div>
            <h1 className="mt-2 text-2xl font-bold text-slate-700">{book.title}</h1>
            {book.author && <p className="text-xs text-slate-400 mt-1">{book.author}</p>}
          </div>

          {total > 1 && (
            <Btn
              variant="primary"
              className="mt-4 w-full"
              onClick={() => openChapter(Math.min(lastIdx, completed))}
            >
              {completed === 0 ? "开始阅读 ▶" : `继续阅读 · 第 ${Math.min(lastIdx, completed) + 1} 章 ▶`}
            </Btn>
          )}

          <div className="mt-4 space-y-2">
            {book.chapters.map((c) => {
              const isDone = c.idx < completed;
              const isLocked = c.idx > completed;
              return (
                <button
                  key={c.idx}
                  onClick={() => openChapter(c.idx)}
                  disabled={isLocked}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 text-left transition ${
                    isLocked
                      ? "bg-slate-100 ring-slate-200 text-slate-400 cursor-not-allowed"
                      : "bg-white ring-slate-200 hover:bg-purple-50 text-slate-700"
                  }`}
                >
                  <span className="text-2xl">{isLocked ? "🔒" : c.emoji}</span>
                  <span className="flex-1 font-bold">
                    {total > 1 ? `第 ${c.idx + 1} 章 · ` : ""}{c.title}
                  </span>
                  {isDone && <span className="text-emerald-500">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
