// app/(game)/story/[bookId]/page.tsx
"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { Btn } from "@/components/Btn";
import { BackButton } from "@/components/BackButton";
import { getBook } from "@/lib/content/storybooks";
import type { SessionResult } from "@/components/games/types";
import { ChapterReader } from "@/components/games/story/ChapterReader";
import { UnlockConfirm } from "@/components/story/UnlockConfirm";
import {
  RedeemError,
  chapterUnlockState,
  fetchRewardCatalog,
  redeemRewardResource,
} from "@/lib/rewards/client";

interface ChapterCatalog {
  chapterIdx: number;
  resourceId: string | null;
  unlocked: boolean;
  available: boolean;
  starsCost: number;
}

function redeemMessage(error: RedeemError): string {
  switch (error.code) {
    case "insufficient_stars":
      return error.needed ? `还差 ${error.needed} 颗星星` : "星星不够啦";
    case "previous_chapter_required":
      return "先解锁上一章哦";
    case "resource_unavailable":
      return "这一章还没准备好";
    case "out_of_stock":
      return "暂时没有名额啦";
    default:
      return "解锁失败，再试一次";
  }
}

function applyUnlock(list: ChapterCatalog[], idx: number): ChapterCatalog[] {
  return list.map((c) =>
    c.chapterIdx === idx
      ? { ...c, unlocked: true }
      : c.chapterIdx === idx + 1
        ? { ...c, available: true }
        : c,
  );
}

export default function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const bumpStars = useGameStore((s) => s.bumpStars);
  const setStars = useGameStore((s) => s.setStars);
  const { sfx } = useSFX();
  const book = getBook(bookId);

  const [completed, setCompleted] = useState(0);
  const [lastIdx, setLastIdx] = useState(0);
  const [reading, setReading] = useState<number | null>(null);
  const [chapters, setChapters] = useState<ChapterCatalog[]>([]);
  const [balance, setBalance] = useState(child?.totalStars ?? 0);
  const [unlockTarget, setUnlockTarget] = useState<number | null>(null);
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      try {
        const [readingRes, catalog] = await Promise.all([
          fetch(`/api/reading/${child.id}`),
          fetchRewardCatalog(child.id),
        ]);
        if (readingRes.ok) {
          const j = await readingRes.json();
          const p = (j.progress ?? []).find((x: { bookId: string }) => x.bookId === bookId);
          if (p) {
            setCompleted(p.completedChapters ?? 0);
            setLastIdx(p.lastChapterIdx ?? 0);
          }
        }
        setBalance(catalog.balance);
        const story = catalog.stories.find((s) => s.bookId === bookId);
        if (story) {
          setChapters(
            story.chapters.map((c) => ({
              chapterIdx: c.chapterIdx,
              resourceId: c.resourceId,
              unlocked: c.unlocked,
              available: c.available,
              starsCost: c.starsCost,
            })),
          );
        }
      } catch {
        // Catalog unavailable: only the free first chapter stays openable.
      }
    })();
  }, [child, bookId, router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2400);
    return () => clearTimeout(timer);
  }, [notice]);

  const chapterMap = useMemo(
    () => new Map(chapters.map((c) => [c.chapterIdx, c])),
    [chapters],
  );

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

  const viewFor = (idx: number) => {
    const cat = chapterMap.get(idx);
    return chapterUnlockState(
      cat ?? { unlocked: false, available: idx === 0, starsCost: 0 },
      balance,
    );
  };

  const onChapterComplete = async (idx: number, r: SessionResult) => {
    bumpStars(r.starsEarned);
    setBalance((b) => b + r.starsEarned);
    const newCompleted = Math.max(completed, idx + 1);
    const newLast = Math.min(idx + 1, total - 1);
    const finished = idx + 1 >= total;
    setCompleted(newCompleted);
    setLastIdx(newLast);
    setReading(null);
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
          body: JSON.stringify({ bookId: book.id, lastChapterIdx: newLast, completedChapters: newCompleted, finished }),
        }),
      ]);
    } catch {
      // Network failure: local state already advanced; reading is not blocked.
    }
  };

  const doRedeem = async (idx: number, resourceId: string, silent: boolean) => {
    setUnlockBusy(true);
    setUnlockError(null);
    try {
      const out = await redeemRewardResource(resourceId, child.id);
      setBalance(out.balance);
      setStars(out.balance);
      setChapters((prev) => applyUnlock(prev, idx));
      setUnlockTarget(null);
      sfx.pageFlip();
      setReading(idx);
    } catch (error) {
      const msg = error instanceof RedeemError ? redeemMessage(error) : "解锁失败，再试一次";
      if (silent) setNotice(msg);
      else setUnlockError(msg);
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleChapterClick = (idx: number) => {
    const cat = chapterMap.get(idx);
    const view = viewFor(idx);
    if (view.canOpen) {
      sfx.pageFlip();
      setReading(idx);
      return;
    }
    if (view.kind === "locked") {
      setNotice("先解锁上一章哦");
      return;
    }
    if (view.kind === "insufficient") {
      setNotice(`还差 ${Math.max(0, view.cost - balance)} 颗星星`);
      return;
    }
    if (!cat?.resourceId) {
      // No resource row yet (content not synced): open without charging.
      sfx.pageFlip();
      setReading(idx);
      return;
    }
    if (view.kind === "free") {
      void doRedeem(idx, cat.resourceId, true);
      return;
    }
    setUnlockError(null);
    setUnlockTarget(idx);
  };

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

  const targetCat = unlockTarget !== null ? chapterMap.get(unlockTarget) : null;
  const targetChapter = unlockTarget !== null ? book.chapters[unlockTarget] : null;

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto">
        <BackButton
          label="返回书架"
          onClick={() => { sfx.click(); router.push("/story"); }}
          className="mb-3"
        />
        <div className="rounded-3xl bg-white/85 backdrop-blur p-5 shadow-xl ring-1 ring-white/60">
          <div className="text-center">
            <div className="text-6xl">{book.emoji}</div>
            <h1 className="mt-2 text-2xl font-bold text-slate-700">{book.title}</h1>
            {book.author && <p className="text-xs text-slate-400 mt-1">{book.author}</p>}
            <p className="mt-1 text-sm font-bold text-amber-500">⭐ {balance}</p>
          </div>

          {notice && (
            <p className="mt-3 anim-slide-up rounded-2xl bg-amber-50 px-4 py-2 text-center text-sm font-bold text-amber-600 ring-1 ring-amber-200">
              {notice}
            </p>
          )}

          {total > 1 && (
            <Btn variant="primary" className="mt-4 w-full" onClick={() => handleChapterClick(lastIdx)}>
              {completed === 0 ? "开始阅读 ▶" : `继续阅读 · 第 ${lastIdx + 1} 章 ▶`}
            </Btn>
          )}

          <div className="mt-4 space-y-2">
            {book.chapters.map((c) => {
              const view = viewFor(c.idx);
              const isDone = c.idx < completed;
              const isCurrent = c.idx === lastIdx;
              return (
                <button
                  key={c.idx}
                  onClick={() => handleChapterClick(c.idx)}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 text-left transition hover:bg-purple-50 text-slate-700 ${
                    isCurrent ? "bg-purple-50 ring-purple-300" : "bg-white ring-slate-200"
                  } ${view.kind === "locked" ? "opacity-60" : ""}`}
                >
                  <span className="text-2xl">{view.kind === "locked" ? "🔒" : c.emoji}</span>
                  <span className="flex-1 font-bold">
                    {total > 1 ? `第 ${c.idx + 1} 章 · ` : ""}
                    {c.title}
                  </span>
                  {isDone && <span className="text-emerald-500">✓</span>}
                  {view.kind !== "unlocked" && (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        view.kind === "free"
                          ? "bg-emerald-100 text-emerald-600"
                          : view.kind === "affordable"
                            ? "bg-amber-100 text-amber-600"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {view.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {unlockTarget !== null && targetChapter && (
        <UnlockConfirm
          title={targetChapter.title}
          emoji={targetChapter.emoji}
          cost={targetCat?.starsCost ?? 0}
          balance={balance}
          busy={unlockBusy}
          error={unlockError}
          onCancel={() => {
            if (!unlockBusy) setUnlockTarget(null);
          }}
          onConfirm={() => {
            if (targetCat?.resourceId) void doRedeem(unlockTarget, targetCat.resourceId, false);
          }}
        />
      )}
    </main>
  );
}
