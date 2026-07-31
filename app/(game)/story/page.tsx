// app/(game)/story/page.tsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { BackButton } from "@/components/BackButton";
import { getAllBooks } from "@/lib/content/storybooks";
import { fetchRewardCatalog } from "@/lib/rewards/client";
import { showFairyGuide } from "@/lib/fairy-guide";

interface BookInfo {
  kind: "novel" | "tale";
  total: number;
  unlocked: number;
  taleCost: number;
  taleUnlocked: boolean;
}

export default function StoryLibraryPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const { sfx } = useSFX();
  const [info, setInfo] = useState<Record<string, BookInfo>>({});
  const books = getAllBooks();

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      try {
        const catalog = await fetchRewardCatalog(child.id);
        const map: Record<string, BookInfo> = {};
        for (const story of catalog.stories) {
          map[story.bookId] = {
            kind: story.kind,
            total: story.chapters.length,
            unlocked: story.chapters.filter((c) => c.unlocked).length,
            taleCost: story.chapters[0]?.starsCost ?? 0,
            taleUnlocked: story.chapters[0]?.unlocked ?? false,
          };
        }
        setInfo(map);
      } catch {
        // Catalog unavailable: cards fall back to a neutral label.
      }
    })();
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    showFairyGuide({ event: "enter", text: "挑一本喜欢的故事吧，我会陪你读完今天的奇遇！", autoHideMs: 5200 });
  }, [child]);

  if (!child) return null;

  const novels = books.filter((b) => b.kind === "novel");
  const tales = books.filter((b) => b.kind === "tale");

  const openBook = (id: string) => {
    sfx.click();
    router.push(`/story/${id}`);
  };

  const Card = ({ id, emoji, title, total }: { id: string; emoji: string; title: string; total: number }) => {
    const meta = info[id];
    let subtitle = "开始阅读";
    if (meta?.kind === "tale") {
      subtitle = meta.taleUnlocked ? "已解锁 ✓" : `⭐ ${meta.taleCost}`;
    } else if (total > 1) {
      subtitle = `${meta?.unlocked ?? 0} / ${total} 章解锁`;
    }
    return (
      <button
        onClick={() => openBook(id)}
        aria-label={`打开《${title}》`}
        className="storybook-paper overflow-hidden rounded-3xl p-3 text-left backdrop-blur transition hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="relative h-28 overflow-hidden rounded-2xl bg-sky-100">
          <Image
            src={total > 1 ? "/ui/story/storybook-hero-v1.png" : "/ui/islands/story.webp"}
            alt=""
            fill
            sizes="(max-width: 639px) 45vw, 220px"
            className={total > 1 ? "object-cover" : "object-contain p-2"}
          />
          <span className="absolute bottom-1 right-2 rounded-full bg-white/90 px-2 py-1 text-xl shadow">{emoji}</span>
        </div>
        <div className="mt-2 font-bold text-slate-700 text-center">{title}</div>
        <div className="mt-1 text-xs text-center text-slate-500">{subtitle}</div>
      </button>
    );
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="storybook-paper mb-4 flex flex-wrap items-center gap-3 rounded-[2rem] p-4 backdrop-blur">
          <BackButton label="返回世界" onClick={() => { sfx.click(); router.push("/world"); }} />
          <Image src="/ui/islands/story.webp" alt="" width={80} height={80} loading="eager" className="ml-auto h-16 w-16 object-contain drop-shadow-lg sm:ml-0" />
          <div>
            <h1 className="text-2xl font-black text-slate-800">故事书架</h1>
            <p className="text-sm font-bold text-emerald-600">选一本故事，开启今天的奇遇</p>
          </div>
        </header>

        <figure className="storybook-paper mb-5 overflow-hidden rounded-[2rem] p-2">
          <Image
            src="/ui/story/storybook-hero-v1.png"
            alt="公主和小龙守护魔法王国"
            width={1200}
            height={675}
            preload
            className="aspect-[16/7] max-h-72 w-full rounded-[1.5rem] object-cover sm:aspect-[16/6]"
          />
        </figure>

        {novels.length > 0 && (
          <>
            <h2 className="mb-2 px-1 text-xl font-black text-slate-700">长篇故事</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {novels.map((b) => (
                <Card key={b.id} id={b.id} emoji={b.emoji} title={b.title} total={b.chapters.length} />
              ))}
            </div>
          </>
        )}

        <h2 className="mb-2 px-1 text-xl font-black text-slate-700">短篇绘本</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tales.map((b) => (
            <Card key={b.id} id={b.id} emoji={b.emoji} title={b.title} total={b.chapters.length} />
          ))}
        </div>
      </div>
    </main>
  );
}
