// app/(game)/literature/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { BackButton } from "@/components/BackButton";
import { PARABLES, QUOTE_DECKS } from "@/content/classics";
import { showFairyGuide } from "@/lib/fairy-guide";

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

  useEffect(() => {
    if (!child) return;
    showFairyGuide({ event: "enter", text: "古人的智慧藏在小故事和名句里，我们一起找一找吧！", autoHideMs: 5200 });
  }, [child]);

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
        <header className="mb-5 flex flex-wrap items-center gap-3 rounded-[2rem] bg-white/88 p-4 shadow-xl ring-2 ring-white/70 backdrop-blur">
          <BackButton label="返回世界" onClick={() => { sfx.click(); router.push("/world"); }} />
          <Image src="/ui/islands/literature.webp" alt="" width={80} height={80} className="ml-auto h-16 w-16 object-contain drop-shadow-lg sm:ml-0" />
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              诸子智慧
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              听一听古人的小故事，读一读了不起的名句～
            </p>
          </div>
        </header>

        {/* 寓言故事 */}
        <div className="mb-2 px-1 text-sm font-bold text-emerald-900 drop-shadow-[0_1px_0_rgba(255,255,255,.8)]">
          📖 智慧小故事（庄子）
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {PARABLES.map((b) => (
            <button
              key={b.id}
              onClick={() => openParable(b.id)}
              aria-label={`阅读《${b.title}》`}
              className="storybook-paper overflow-hidden rounded-3xl p-3 text-left transition hover:-translate-y-1 hover:scale-[1.02]"
            >
              <div className="relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-50">
                <Image src="/ui/islands/literature.webp" alt="" fill sizes="(max-width: 639px) 45vw, 220px" className="object-contain p-3 opacity-90" />
                <span className="absolute bottom-2 left-2 rounded-full bg-emerald-800/85 px-2 py-1 text-xs font-black text-white">智慧故事</span>
              </div>
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
        <div className="mb-2 px-1 text-sm font-bold text-emerald-900 drop-shadow-[0_1px_0_rgba(255,255,255,.8)]">
          🌸 名句卡组（诸子百家）
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUOTE_DECKS.map((d) => (
            <button
              key={d.id}
              onClick={() => openDeck(d.id)}
              aria-label={`翻看${d.philosopher}的名句卡`}
              className="storybook-paper overflow-hidden rounded-3xl p-3 text-left transition hover:-translate-y-1 hover:scale-[1.02]"
            >
              <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-100 via-white to-rose-100 p-3 ring-1 ring-amber-200/70">
                <Image src="/ui/islands/literature.webp" alt="" fill sizes="(max-width: 639px) 45vw, 220px" className="object-cover opacity-15" />
                <span className="relative rounded-xl border-2 border-amber-700/30 bg-[#fffaf0]/90 px-3 py-2 text-center text-lg font-black text-amber-900 shadow-sm">{d.philosopher}<br /><small className="text-xs text-amber-700">名句卡</small></span>
              </div>
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
