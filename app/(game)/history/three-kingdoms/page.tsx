// app/(game)/history/three-kingdoms/page.tsx
// 三国朝代详情页：Hero + 5 Tab（听故事/群英谱/大事件/地图/任务）。
// 一切机制派生自 /api/reading 的 completedChapters（见 lib/history/threeKingdomsProgress.ts）。
// 阅读流复用 ThreeKingdomsReader（ChapterReader + 进度上报）。入口来自 /history 历史长卷。
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { BackButton } from "@/components/BackButton";
import { ThreeKingdomsReader } from "@/components/history/ThreeKingdomsReader";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import { THREE_KINGDOMS_DETAIL } from "@/content/history/three-kingdoms-detail";
import { DetailHero } from "@/components/history/threeKingdoms/DetailHero";
import { FactionTabs, type TabKey } from "@/components/history/threeKingdoms/FactionTabs";
import { StoryTab } from "@/components/history/threeKingdoms/StoryTab";
import { PeopleTab } from "@/components/history/threeKingdoms/PeopleTab";
import { EventsTab } from "@/components/history/threeKingdoms/EventsTab";
import { MapTab } from "@/components/history/threeKingdoms/MapTab";
import { TasksTab } from "@/components/history/threeKingdoms/TasksTab";
import { TK, BG_TILE } from "@/components/history/threeKingdoms/theme";
import { showFairyGuide } from "@/lib/fairy-guide";

const TOTAL = THREE_KINGDOMS.chapters.length;

export default function ThreeKingdomsPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const [unlockedThrough, setUnlockedThrough] = useState(0);
  const [reading, setReading] = useState<number | null>(null);
  const [tab, setTab] = useState<TabKey>("story");

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/reading/${child.id}`);
        if (res.ok) {
          const j = (await res.json()) as { progress: { bookId: string; completedChapters: number }[] };
          const row = (j.progress ?? []).find((p) => p.bookId === THREE_KINGDOMS.id);
          setUnlockedThrough(row?.completedChapters ?? 0);
        }
      } catch {
        /* 网络失败：默认只解锁第 1 章 */
      }
    })();
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    showFairyGuide({ event: "enter", text: "从“听故事”开始吧，人物、事件和地图会随着阅读慢慢解锁！", autoHideMs: 5600 });
  }, [child]);

  if (!child) return null;

  const nextChapter = unlockedThrough < TOTAL ? unlockedThrough : 0;
  const startReading = (idx: number) => setReading(idx);

  if (reading !== null) {
    return (
      <main className="min-h-screen px-4 pb-10 pt-20">
        <BackButton label="三国时代" className="mb-3" onClick={() => setReading(null)} />
        <ThreeKingdomsReader
          chapterIdx={reading}
          childId={child.id}
          progress={unlockedThrough}
          onDone={() => {
            setReading(null);
            // 与服务端一致：只有读完前沿章才推进解锁；跳读/重读不连带解锁。
            setUnlockedThrough((n) => (reading === n ? n + 1 : n));
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 pb-12 pt-20 sm:px-4">
      <div className="mx-auto max-w-4xl">
        <BackButton label="历史长卷" className="mb-3" onClick={() => router.push("/history")} />
        {/* 三国卷面 */}
        <div
          className="rounded-[2rem] p-3 sm:p-5"
          style={{
            backgroundImage: `url(${BG_TILE})`,
            backgroundSize: "300px",
            backgroundColor: TK.parchmentDeep,
            border: `3px solid ${TK.gold}`,
            boxShadow: "0 14px 40px rgba(0,0,0,.45), inset 0 0 0 2px rgba(201,162,75,.4)",
          }}
        >
          <DetailHero
            detail={THREE_KINGDOMS_DETAIL}
            allRead={unlockedThrough >= TOTAL}
            onStartAdventure={() => startReading(nextChapter)}
            onOpenMap={() => setTab("map")}
          />

          <div className="mt-4">
            <FactionTabs active={tab} onChange={setTab} />
          </div>

          <div className="mt-4">
            {tab === "story" && <StoryTab completedChapters={unlockedThrough} onPick={startReading} />}
            {tab === "people" && <PeopleTab completedChapters={unlockedThrough} />}
            {tab === "events" && <EventsTab completedChapters={unlockedThrough} onPickChapter={startReading} />}
            {tab === "map" && <MapTab />}
            {tab === "tasks" && <TasksTab completedChapters={unlockedThrough} />}
          </div>
        </div>
      </div>

    </main>
  );
}
