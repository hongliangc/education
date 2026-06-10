// app/(game)/literature/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { PARABLES, QUOTE_DECKS } from "@/content/classics";

export default function LiteratureHomePage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const { sfx } = useSFX();
  const [finished, setFinished] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      const res = await fetch(`/api/reading/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        const map: Record<string, boolean> = {};
        for (const p of j.progress ?? [])
          map[p.bookId] = !!(p.finished || p.completedChapters > 0);
        setFinished(map);
      }
    })();
  }, [child, router]);

  if (!child) return null;

  const openParable = (id: string) => {
    sfx.click();
    router.push(`/literature/read/${id}`);
  };
  const openDeck = (id: string) => {
    sfx.click();
    router.push(`/literature/deck/${id}`);
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-white drop-shadow mb-1">
          🪷 诸子智慧
        </h1>
        <p className="text-sm text-white/90 drop-shadow mb-5">
          听一听古人的小故事，读一读了不起的名句～
        </p>

        {/* 寓言故事 */}
        <div className="mb-2 px-1 text-sm font-bold text-white/90 drop-shadow">
          📖 智慧小故事（庄子）
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {PARABLES.map((b) => (
            <button
              key={b.id}
              onClick={() => openParable(b.id)}
              aria-label={`阅读《${b.title}》`}
              className="rounded-3xl bg-white/85 backdrop-blur p-4 shadow ring-1 ring-white/60 text-left transition hover:scale-[1.03]"
            >
              <div className="text-5xl text-center">{b.emoji}</div>
              <div className="mt-2 font-bold text-slate-700 text-center">
                {b.title}
              </div>
              <div className="mt-1 text-xs text-center text-slate-500">
                {finished[b.id] ? "读过啦 ✓" : "开始阅读"}
              </div>
            </button>
          ))}
        </div>

        {/* 名句卡组 */}
        <div className="mb-2 px-1 text-sm font-bold text-white/90 drop-shadow">
          🌸 名句卡组（诸子百家）
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUOTE_DECKS.map((d) => (
            <button
              key={d.id}
              onClick={() => openDeck(d.id)}
              aria-label={`翻看${d.philosopher}的名句卡`}
              className="rounded-3xl bg-white/85 backdrop-blur p-4 shadow ring-1 ring-white/60 text-left transition hover:scale-[1.03]"
            >
              <div className="text-5xl text-center">{d.emoji}</div>
              <div className="mt-2 font-bold text-slate-700 text-center">
                {d.title}
              </div>
              <div className="mt-1 text-xs text-center text-slate-500">
                {d.philosopher} · {d.cards.length} 张卡
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
