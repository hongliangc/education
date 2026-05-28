"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { FairyBubble } from "@/components/fairy/FairyBubble";
import { useSFX } from "@/components/audio/useSFX";
import { MODULES, MODULE_META, type ModuleId } from "@/lib/utils";

interface NodeProgress {
  module: ModuleId;
  level: number;
  stars: number;
  masteryPct: number;
}

// 关卡节点在 SVG viewBox 0..1000 x 0..600 中的位置
const NODES: { id: ModuleId; x: number; y: number }[] = [
  { id: "WRITING",  x: 150, y: 460 },
  { id: "ALPHABET", x: 340, y: 320 },
  { id: "MATH",     x: 520, y: 460 },
  { id: "WORDS",    x: 720, y: 280 },
  { id: "STORY",    x: 880, y: 460 },
];

export default function WorldMapPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const [progressMap, setProgressMap] = useState<Record<string, NodeProgress>>({});
  const [hello, setHello] = useState<string | null>(null);
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
        const map: Record<string, NodeProgress> = {};
        for (const p of j.progress ?? []) map[p.module] = p;
        setProgressMap(map);
      }
      setHello(
        `今天好呀，${child.name}！\n你已经获得 ${child.totalStars} 颗星啦 ⭐\n选一个关卡开始冒险吧！`,
      );
    })();
  }, [child, router]);

  if (!child) return null;

  const open = (m: ModuleId) => {
    sfx.click();
    router.push(`/play/${m.toLowerCase()}`);
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        {hello && (
          <div className="mb-6">
            <FairyBubble text={hello} mood="excited" />
          </div>
        )}

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
              const meta = MODULE_META[n.id];
              const prog = progressMap[n.id];
              const stars = prog?.stars ?? 0;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y})`}
                  className="cursor-pointer"
                  onClick={() => open(n.id)}
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
                    {Array.from({ length: 3 })
                      .map((_, i) => (i < Math.min(3, Math.floor(stars / 3)) ? "★" : "☆"))
                      .join("")}
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

        {/* 调试用：所有模块快捷入口 */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {MODULES.map((m) => {
            const meta = MODULE_META[m];
            return (
              <button
                key={m}
                onClick={() => open(m)}
                className="rounded-2xl bg-white/80 backdrop-blur py-3 shadow ring-1 ring-white hover:scale-105 transition"
              >
                <div className="text-3xl">{meta.emoji}</div>
                <div className="text-xs font-bold text-slate-700">{meta.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
