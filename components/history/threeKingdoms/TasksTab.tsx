// 任务/奖励：今日任务清单（派生）+ 徽章墙（已得/未得，派生）。
"use client";
import { useMemo } from "react";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import { THREE_KINGDOMS_DETAIL } from "@/content/history/three-kingdoms-detail";
import { knownCount, badgeEarned } from "@/lib/history/threeKingdomsProgress";
import { TK, panelStyle } from "./theme";

const SERIF = "var(--font-history)";
const chapters = THREE_KINGDOMS.chapters;
const coreKeys = THREE_KINGDOMS_DETAIL.people.filter((p) => p.core).map((p) => p.key);

export function TasksTab({ completedChapters }: { completedChapters: number }) {
  const known = useMemo(() => knownCount(coreKeys, chapters, completedChapters), [completedChapters]);

  const tasks = [
    { label: "读完一个三国故事", done: completedChapters >= 1 },
    { label: "认识 3 位三国人物", done: known >= 3 },
    { label: "通关《赤壁之战》", done: completedChapters > 3 },
    { label: "读完全部 6 个故事", done: completedChapters >= chapters.length },
  ];
  const ctx = { completedChapters, knownCount: known };

  return (
    <div>
      {/* 今日任务 */}
      <div className="mb-4 rounded-3xl p-4" style={panelStyle}>
        <div className="mb-3 text-lg font-black" style={{ color: TK.ink, fontFamily: SERIF }}>📋 三国小任务</div>
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.label} className="flex items-center gap-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: t.done ? TK.gold : "rgba(43,38,34,.25)" }}
                aria-hidden
              >
                {t.done ? "✓" : "·"}
              </span>
              <span
                className="text-base"
                style={{ color: TK.ink, textDecoration: t.done ? "line-through" : undefined, opacity: t.done ? 0.65 : 1 }}
              >
                {t.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 徽章墙 */}
      <div className="rounded-3xl p-4" style={panelStyle}>
        <div className="mb-3 text-lg font-black" style={{ color: TK.ink, fontFamily: SERIF }}>🏅 三国徽章墙</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THREE_KINGDOMS_DETAIL.badges.map((b) => {
            const earned = badgeEarned(b.condition, ctx);
            return (
              <div
                key={b.key}
                className="flex flex-col items-center rounded-2xl p-3 text-center"
                style={{
                  background: earned ? "rgba(201,162,75,.16)" : "rgba(43,38,34,.06)",
                  border: `2px solid ${earned ? TK.gold : "rgba(43,38,34,.18)"}`,
                  opacity: earned ? 1 : 0.7,
                }}
              >
                <span
                  className="text-4xl"
                  style={{ filter: earned ? undefined : "grayscale(1)", opacity: earned ? 1 : 0.5 }}
                  aria-hidden
                >
                  {b.icon}
                </span>
                <div className="mt-1 text-sm font-black" style={{ color: TK.ink, fontFamily: SERIF }}>{b.title}</div>
                <div className="mt-0.5 text-xs" style={{ color: "rgba(43,38,34,.7)" }}>
                  {earned ? "已获得" : b.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
