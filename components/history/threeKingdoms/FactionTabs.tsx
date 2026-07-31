// 详情页 5 个导航 Tab：听故事 / 群英谱 / 大事件 / 地图 / 任务。
"use client";
import { TK } from "./theme";

const SERIF = "var(--font-history)";

export type TabKey = "story" | "people" | "events" | "map" | "tasks";

export const TABS: { key: TabKey; label: string; emoji: string }[] = [
  { key: "story", label: "听故事", emoji: "📖" },
  { key: "people", label: "群英谱", emoji: "🎴" },
  { key: "events", label: "大事件", emoji: "⚔️" },
  { key: "map", label: "地图", emoji: "🗺️" },
  { key: "tasks", label: "任务", emoji: "🏅" },
];

export function FactionTabs({ active, onChange }: { active: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav aria-label="三国专题栏目" className="scroll-hide flex gap-2 overflow-x-auto py-1">
      {TABS.map((t) => {
        const on = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            aria-current={on}
            className="min-h-11 shrink-0 rounded-2xl px-4 py-2 text-base font-black transition active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            style={{
              fontFamily: SERIF,
              letterSpacing: "1px",
              color: on ? "#fff" : TK.ink,
              background: on ? `linear-gradient(180deg, ${TK.gold}, ${TK.goldDeep})` : "rgba(244,223,170,.85)",
              border: `2px solid ${TK.gold}`,
              boxShadow: on ? "0 4px 12px rgba(0,0,0,.3)" : undefined,
            }}
          >
            <span className="mr-1" aria-hidden>{t.emoji}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
