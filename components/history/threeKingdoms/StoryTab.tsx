// 听故事：3 个吊兴趣问题横幅 + 复用 StoryCardRow（顺序解锁、进 ChapterReader）。
"use client";
import { StoryCardRow } from "@/components/history/StoryCardRow";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import { THREE_KINGDOMS_DETAIL } from "@/content/history/three-kingdoms-detail";
import { TK, panelStyle } from "./theme";

const SERIF = "var(--font-history), 'Noto Serif SC', serif";

export function StoryTab({
  completedChapters,
  onPick,
}: {
  completedChapters: number;
  onPick: (idx: number) => void; // 进入指定章阅读（问题横幅与故事卡共用）
}) {
  return (
    <div>
      <div className="mb-4 rounded-3xl p-4" style={panelStyle}>
        <div className="mb-2 text-lg font-black" style={{ color: TK.ink, fontFamily: SERIF }}>
          你想先知道什么？
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {THREE_KINGDOMS_DETAIL.openingQuestions.map((item, i) => (
            <button
              key={i}
              onClick={() => onPick(item.chapterIdx)}
              className="rounded-2xl p-3 text-left text-sm font-bold transition hover:scale-[1.02]"
              style={{
                background: "rgba(201,162,75,.14)",
                color: TK.ink,
                border: `1.5px solid ${TK.gold}`,
              }}
            >
              <span className="mr-1" aria-hidden>❓</span>
              {item.q}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 text-base font-black" style={{ color: "#fff", fontFamily: SERIF }}>
        🏯 三国故事 · 共 {THREE_KINGDOMS.chapters.length} 回
      </div>
      <StoryCardRow chapters={THREE_KINGDOMS.chapters} unlockedThrough={completedChapters} onPick={onPick} />
    </div>
  );
}
