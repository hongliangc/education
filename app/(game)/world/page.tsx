"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { FairyBubble } from "@/components/fairy/FairyBubble";
import { FairyChat } from "@/components/fairy/FairyChat";
import { useSFX } from "@/components/audio/useSFX";
import { MODULES, MODULE_META, type ModuleId } from "@/lib/utils";
import {
  GRADE_LABELS,
  indexGradeProgress,
  LEGACY_GRADE,
  progressKey,
  resolveChildGrade,
} from "@/lib/grades";

interface NodeProgress {
  module: string;
  gradeLevel: string;
  level: number;
  stars: number;
  masteryPct: number;
}

type WorldNode =
  | { kind: "module"; id: ModuleId; x: number; y: number }
  | {
      kind: "theater";
      id: "THEATER";
      x: number;
      y: number;
      label: string;
      emoji: string;
      color: string;
    };

// 关卡节点在 SVG viewBox 0..1000 x 0..600 中的位置
const NODES: WorldNode[] = [
  { kind: "module", id: "WRITING",  x: 135, y: 460 },
  { kind: "module", id: "ALPHABET", x: 310, y: 320 },
  { kind: "module", id: "MATH",     x: 480, y: 460 },
  { kind: "module", id: "WORDS",    x: 665, y: 285 },
  { kind: "module", id: "STORY",    x: 835, y: 455 },
  {
    kind: "theater",
    id: "THEATER",
    x: 905,
    y: 225,
    label: "视频影院",
    emoji: "🎬",
    color: "#fb7185",
  },
];

export default function WorldMapPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const [rows, setRows] = useState<NodeProgress[]>([]);
  const [hello, setHello] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const { sfx } = useSFX();

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      const res = await fetch(`/api/progress/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        setRows((j.progress ?? []) as NodeProgress[]);
      }
      setHello(
        `今天好呀，${child.name}！\n你现在有 ${child.totalStars} 颗星啦 ⭐\n选一个关卡开始冒险吧！`,
      );
    })();
  }, [child, router]);

  // Current-grade progress, keyed `<module>:<grade>` (LEGACY excluded). Non-graded modules keep a
  // LEGACY row, so fall back to it when a module has no row for the active grade yet.
  const gradeMap = useMemo(() => indexGradeProgress(rows), [rows]);
  const legacyMap = useMemo(() => {
    const map = new Map<string, NodeProgress>();
    for (const row of rows) if (row.gradeLevel === LEGACY_GRADE) map.set(row.module, row);
    return map;
  }, [rows]);

  if (!child) return null;

  const childGrade = resolveChildGrade(child);
  const moduleProgress = (module: ModuleId): NodeProgress | undefined =>
    gradeMap.get(progressKey(module, childGrade)) ?? legacyMap.get(module);

  const open = (m: ModuleId) => {
    sfx.click();
    router.push(m === "STORY" ? "/story" : `/play/${m.toLowerCase()}`);
  };

  const openTheater = () => {
    sfx.click();
    router.push("/theater");
  };

  const openShop = () => {
    sfx.click();
    router.push("/shop");
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        {hello && (
          <div className="mb-6">
            <button
              onClick={() => setChatOpen(true)}
              className="block text-left"
              aria-label="和精灵聊天"
            >
              <FairyBubble text={hello} mood="excited" />
              <div className="mt-1 ml-2 text-xs font-bold text-white/90 drop-shadow animate-bounce">
                👆 点我问问题
              </div>
            </button>
          </div>
        )}

        {/* 模块选择器（顶部） */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-bold text-white/90 drop-shadow">选一个去玩 🎮</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-slate-700 shadow ring-1 ring-white">
              🎓 {GRADE_LABELS[childGrade]}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {MODULES.map((m) => {
              const meta = MODULE_META[m];
              return (
                <button
                  key={m}
                  onClick={() => open(m)}
                  aria-label={`进入${meta.label}`}
                  className="rounded-2xl bg-white/80 py-3 shadow ring-1 ring-white backdrop-blur transition hover:scale-105"
                >
                  <div className="text-3xl">{meta.emoji}</div>
                  <div className="text-xs font-bold text-slate-700">{meta.label}</div>
                </button>
              );
            })}
            <button
              onClick={openTheater}
              aria-label="进入视频影院"
              className="rounded-2xl bg-white/80 py-3 shadow ring-1 ring-white backdrop-blur transition hover:scale-105"
            >
              <div className="text-3xl">🎬</div>
              <div className="text-xs font-bold text-slate-700">视频影院</div>
            </button>
            <button
              onClick={openShop}
              aria-label="进入星星商店"
              className="rounded-2xl bg-white/80 py-3 shadow ring-1 ring-white backdrop-blur transition hover:scale-105"
            >
              <div className="text-3xl">🏪</div>
              <div className="text-xs font-bold text-slate-700">星星商店</div>
            </button>
          </div>
        </div>

        <div className="relative rounded-[2.5rem] bg-white/30 backdrop-blur ring-1 ring-white/40 shadow-xl overflow-hidden">
          <svg viewBox="0 0 1000 600" className="w-full h-auto block">
            {/* 节点之间的虚线路径 */}
            {NODES.slice(0, -1).map((n, i) => {
              const m = NODES[i + 1];
              return (
                <path
                  key={i}
                  d={`M${n.x},${n.y} Q${(n.x + m.x) / 2},${Math.min(n.y, m.y) - 80} ${m.x},${m.y}`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="6"
                  strokeDasharray="14 14"
                  strokeLinecap="round"
                  opacity="0.85"
                />
              );
            })}

            {NODES.map((n) => {
              const meta =
                n.kind === "module"
                  ? MODULE_META[n.id]
                  : { label: n.label, emoji: n.emoji, color: n.color };
              const prog = n.kind === "module" ? moduleProgress(n.id) : undefined;
              const stars = prog?.stars ?? 0;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className="cursor-pointer"
                  onClick={() => (n.kind === "module" ? open(n.id) : openTheater())}
                >
                  <circle r="56" fill="white" opacity="0.7" />
                  <circle
                    r="48"
                    fill={meta.color}
                    className="anim-pulse-soft"
                    stroke="white"
                    strokeWidth="6"
                  />
                  <text
                    textAnchor="middle"
                    y="14"
                    fontSize="42"
                  >
                    {meta.emoji}
                  </text>
                  <text
                    textAnchor="middle"
                    y="86"
                    fontSize="22"
                    fontWeight="bold"
                    fill="#fff"
                    stroke="#0006"
                    strokeWidth="0.5"
                  >
                    {meta.label}
                  </text>
                  <text
                    textAnchor="middle"
                    y="108"
                    fontSize="18"
                    fill="#fde047"
                  >
                    {n.kind === "module"
                      ? Array.from({ length: 3 })
                          .map((_, i) => (i < Math.min(3, Math.floor(stars / 3)) ? "★" : "☆"))
                          .join("")
                      : "看视频"}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* 每日任务条 */}
        <div className="mt-5 rounded-3xl bg-white/85 backdrop-blur p-4 shadow-xl ring-1 ring-white/40 flex items-center gap-3">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <div className="text-sm text-slate-500">今日任务</div>
            <div className="font-bold text-slate-700">完成 3 个关卡赢取额外 ⭐⭐⭐</div>
          </div>
        </div>
      </div>

      {chatOpen && (
        <FairyChat
          child={{ name: child.name, totalStars: child.totalStars }}
          onClose={() => setChatOpen(false)}
        />
      )}
    </main>
  );
}
