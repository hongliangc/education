"use client";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { interruptHistoryBgm } from "@/components/audio/historyBgm";
import { ChapterReader } from "@/components/games/story/ChapterReader";
import { HistoryNoteCard } from "@/components/history/HistoryNoteCard";
import { Btn } from "@/components/Btn";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import type { SessionResult } from "@/components/games/types";

export function ThreeKingdomsReader({
  chapterIdx,
  childId,
  progress,
  onDone,
}: {
  chapterIdx: number;
  childId: string;
  progress: number;
  onDone: () => void;
}) {
  const bumpStars = useGameStore((s) => s.bumpStars);
  const chapter = THREE_KINGDOMS.chapters[chapterIdx];
  const [showNote, setShowNote] = useState(false);

  // 朝代歌带人声，阅读时会盖过 TTS 旁白：进阅读暂停背景歌曲，退出恢复。
  useEffect(() => interruptHistoryBgm(), []);

  const onChapterComplete = async (r: SessionResult) => {
    bumpStars(r.starsEarned);
    // 进度只在「读完当前前沿章」时 +1：重读早章 / 「先睹为快」跳读后续章都不改进度，
    // 既不回退已解锁章，也不让跳读连带解锁中间章节（单整数模型无法只标记单章）。
    const nextCompleted = chapterIdx === progress ? progress + 1 : progress;
    try {
      await Promise.all([
        fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ childId, module: "HISTORY", ...r }),
        }),
        // Route only exposes PUT (not POST) — align with app/api/reading/[childId]/route.ts
        fetch(`/api/reading/${childId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bookId: THREE_KINGDOMS.id,
            lastChapterIdx: chapterIdx,
            completedChapters: nextCompleted,
            finished: nextCompleted >= THREE_KINGDOMS.chapters.length,
          }),
        }),
      ]);
    } catch {
      /* 上报失败不阻塞体验 */
    }
    setShowNote(true);
  };

  if (showNote) {
    return (
      <div className="mx-auto max-w-md">
        {chapter.historyNote && <HistoryNoteCard note={chapter.historyNote} />}
        <Btn variant="primary" className="mt-4 w-full" onClick={onDone}>
          回三国时代
        </Btn>
      </div>
    );
  }

  return <ChapterReader key={chapter.idx} chapter={chapter} onChapterComplete={onChapterComplete} />;
}
