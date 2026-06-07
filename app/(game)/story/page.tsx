// app/(game)/story/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { getAllBooks } from "@/lib/content/storybooks";

interface ProgressRow {
  bookId: string;
  completedChapters: number;
  finished: boolean;
}

export default function StoryLibraryPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const { sfx } = useSFX();
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const books = getAllBooks();

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      const res = await fetch(`/api/reading/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        const map: Record<string, ProgressRow> = {};
        for (const p of j.progress ?? []) map[p.bookId] = p;
        setProgress(map);
      }
    })();
  }, [child, router]);

  if (!child) return null;

  const novels = books.filter((b) => b.kind === "novel");
  const tales = books.filter((b) => b.kind === "tale");

  const openBook = (id: string) => {
    sfx.click();
    router.push(`/story/${id}`);
  };

  const Card = ({
    id,
    emoji,
    title,
    total,
  }: {
    id: string;
    emoji: string;
    title: string;
    total: number;
  }) => {
    const p = progress[id];
    const done = p?.completedChapters ?? 0;
    return (
      <button
        onClick={() => openBook(id)}
        aria-label={`打开《${title}》`}
        className="rounded-3xl bg-white/85 backdrop-blur p-4 shadow ring-1 ring-white/60 text-left transition hover:scale-[1.03]"
      >
        <div className="text-5xl text-center">{emoji}</div>
        <div className="mt-2 font-bold text-slate-700 text-center">{title}</div>
        <div className="mt-1 text-xs text-center text-slate-500">
          {total > 1 ? `${done} / ${total} 章` : p?.finished ? "已读完 ✓" : "开始阅读"}
        </div>
      </button>
    );
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sfx.click();
              router.push("/world");
            }}
            className="rounded-full bg-white/75 px-4 py-2 font-bold text-slate-700 shadow ring-1 ring-white transition hover:scale-105"
          >
            ← 返回世界
          </button>
          <h1 className="text-2xl font-bold text-white drop-shadow">📚 故事书架</h1>
        </header>

        {novels.length > 0 && (
          <>
            <h2 className="mb-2 px-1 text-xl font-bold text-white/90 drop-shadow">长篇故事</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {novels.map((b) => (
                <Card key={b.id} id={b.id} emoji={b.emoji} title={b.title} total={b.chapters.length} />
              ))}
            </div>
          </>
        )}

        <h2 className="mb-2 px-1 text-xl font-bold text-white/90 drop-shadow">短篇绘本</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tales.map((b) => (
            <Card key={b.id} id={b.id} emoji={b.emoji} title={b.title} total={b.chapters.length} />
          ))}
        </div>
      </div>
    </main>
  );
}
