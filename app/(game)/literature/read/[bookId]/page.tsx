// app/(game)/literature/read/[bookId]/page.tsx
// 寓言阅读器：复用 ChapterReader（与故事同款朗读/理解题），但从 getParable 取书、不接付费解锁。
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { Btn } from "@/components/Btn";
import { getParable } from "@/content/classics";
import type { SessionResult } from "@/components/games/types";
import { ChapterReader } from "@/components/games/story/ChapterReader";

export default function ParableReadPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = use(params);
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const bumpStars = useGameStore((s) => s.bumpStars);
  const book = getParable(bookId);

  useEffect(() => {
    if (!child) router.replace("/child-select");
  }, [child, router]);

  if (!child) return null;
  if (!book) {
    return (
      <main className="min-h-screen pt-20 px-4">
        <div className="max-w-md mx-auto rounded-3xl bg-white/85 p-6 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-2 font-bold text-slate-700">找不到这个故事</p>
          <Btn
            variant="primary"
            className="mt-4"
            onClick={() => router.push("/literature")}
          >
            回诸子智慧
          </Btn>
        </div>
      </main>
    );
  }

  // 寓言均为单章 tale
  const chapter = book.chapters[0];

  const onChapterComplete = async (r: SessionResult) => {
    bumpStars(r.starsEarned);
    try {
      await Promise.all([
        fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ childId: child.id, module: "LITERATURE", ...r }),
        }),
        fetch(`/api/reading/${child.id}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bookId: book.id,
            lastChapterIdx: 0,
            completedChapters: 1,
            finished: true,
          }),
        }),
      ]);
    } catch {
      // 网络失败：本地星星已加，读书优先，不阻断
    }
    router.push("/literature");
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/literature")}
          className="text-white/90 text-sm mb-3"
        >
          ← 诸子智慧
        </button>
        <div className="rounded-3xl bg-white/90 backdrop-blur p-5 shadow-xl ring-1 ring-white/60">
          {book.author && (
            <p className="text-xs text-slate-400 text-center mb-2">{book.author}</p>
          )}
          <ChapterReader
            key={chapter.idx}
            chapter={chapter}
            onChapterComplete={onChapterComplete}
          />
        </div>
      </div>
    </main>
  );
}
