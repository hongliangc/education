"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { MODULE_META, type ModuleId } from "@/lib/utils";
import { MODULE_ART } from "@/lib/ui-assets";
import { KingdomBG } from "@/components/KingdomBG";
import {
  indexGradeProgress,
  LEGACY_GRADE,
  progressKey,
  resolveChildGrade,
} from "@/lib/grades";
import { useVisualQa } from "@/lib/visual-qa";
import { VisualWorldMap } from "@/components/visual-qa/VisualWorldMap";
import { showFairyGuide } from "@/lib/fairy-guide";

interface NodeProgress {
  module: string;
  gradeLevel: string;
  level: number;
  stars: number;
  masteryPct: number;
}

type WorldNode = { id: ModuleId; x: number; y: number };

const NODES: WorldNode[] = [
  { id: "WRITING", x: 12.5, y: 70 },
  { id: "ALPHABET", x: 22, y: 25 },
  { id: "LITERATURE", x: 50, y: 25 },
  { id: "MATH", x: 78, y: 25 },
  { id: "WORDS", x: 37.5, y: 70 },
  { id: "STORY", x: 62.5, y: 70 },
  { id: "HISTORY", x: 87.5, y: 70 },
];

export default function WorldMapPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const activeGrade = useGameStore((s) => s.activeGrade);
  const [rows, setRows] = useState<NodeProgress[]>([]);
  const { sfx } = useSFX();
  const visualQa = useVisualQa();

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    showFairyGuide({
      event: "enter",
      text: `今天好呀，${child.name}！你有 ${child.totalStars} 颗星，选一座小岛开始冒险吧！`,
      autoHideMs: 6500,
    });
    (async () => {
      const res = await fetch(`/api/progress/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        setRows((j.progress ?? []) as NodeProgress[]);
      }
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

  // Progress follows the grade selected in the HUD, falling back to the child's profile grade.
  const grade = activeGrade ?? resolveChildGrade(child);
  const moduleProgress = (module: ModuleId): NodeProgress | undefined =>
    gradeMap.get(progressKey(module, grade)) ?? legacyMap.get(module);

  // 全屏阅读类模块走独立路由，其余走通用 /play/[module]
  const ROUTE_OVERRIDE: Partial<Record<ModuleId, string>> = {
    ALPHABET: "/english",
    STORY: "/story",
    LITERATURE: "/literature",
    HISTORY: "/history",
  };
  const open = (m: ModuleId) => {
    sfx.click();
    const route = ROUTE_OVERRIDE[m] ?? `/play/${m.toLowerCase()}`;
    router.push(visualQa ? `${route}?visual=1` : route);
  };

  const openTheater = () => {
    sfx.click();
    router.push(visualQa ? "/theater?visual=1" : "/theater");
  };

  const openShop = () => {
    sfx.click();
    router.push(visualQa ? "/shop?visual=1" : "/shop");
  };

  if (visualQa) {
    return <VisualWorldMap onOpen={open} onTheater={openTheater} onShop={openShop} />;
  }

  return (
    <main className="relative z-10 min-h-screen pt-20 px-4 pb-10">
      <KingdomBG priority />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-2 px-1 text-center text-sm font-bold text-white/90 drop-shadow">
          选择一座小岛开始冒险 🎮
        </div>
        <div className="grid grid-cols-2 gap-4 sm:hidden">
          {NODES.map((node) => {
            const meta = MODULE_META[node.id];
            const stars = moduleProgress(node.id)?.stars ?? 0;
            return (
              <button
                key={node.id}
                type="button"
                aria-label={`进入${meta.label}`}
                onClick={() => open(node.id)}
                className="group overflow-hidden rounded-3xl bg-white/88 p-2 text-left shadow-lg ring-1 ring-white/70 transition active:scale-[0.98]"
              >
                <Image
                  src={MODULE_ART[node.id]}
                  alt=""
                  width={320}
                  height={240}
                  loading={node.id === "WRITING" || node.id === "MATH" ? "eager" : "lazy"}
                  className="aspect-[4/3] w-full object-contain transition group-active:scale-95"
                />
                <span className="flex items-center justify-between px-2 pb-2">
                  <span className="font-bold text-slate-700">{meta.label}</span>
                  <span className="text-sm font-bold text-amber-500">⭐ {stars}</span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="relative hidden aspect-[16/9] overflow-hidden rounded-[2.5rem] bg-sky-200 shadow-2xl ring-2 ring-white/60 sm:block">
          <Image
            src="/ui/world/world-bg-desktop-v1.png"
            alt="魔法学习王国地图"
            fill
            loading="eager"
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
          {NODES.map((n) => {
              const meta = MODULE_META[n.id];
              const prog = moduleProgress(n.id);
              const stars = prog?.stars ?? 0;
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-label={`进入${meta.label}`}
                  onClick={() => open(n.id)}
                  className="group absolute w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-3xl focus-visible:outline-white"
                  style={{
                    left: `${n.x}%`,
                    top: `${n.y}%`,
                  }}
                >
                  <Image
                    src={MODULE_ART[n.id]}
                    alt=""
                    width={360}
                    height={270}
                    loading={n.id === "MATH" ? "eager" : "lazy"}
                    className="w-full object-contain drop-shadow-xl transition duration-200 group-hover:-translate-y-1 group-hover:scale-105 group-active:scale-95"
                  />
                  <span className="mx-auto -mt-3 block w-max max-w-full rounded-full bg-white/90 px-3 py-1 text-sm font-black text-slate-700 shadow-md backdrop-blur lg:text-base">
                    {meta.label}
                    <span className="ml-2 text-amber-500">
                      {Array.from({ length: 3 })
                      .map((_, i) => (i < Math.min(3, Math.floor(stars / 3)) ? "★" : "☆"))
                      .join("")}
                    </span>
                  </span>
                </button>
              );
            })}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={openTheater}
            className="flex items-center gap-3 rounded-3xl bg-white/85 p-4 text-left shadow-lg ring-1 ring-white/60 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Image src="/ui/locations/cinema.webp" alt="" width={80} height={60} className="h-14 w-auto object-contain" />
            <span>
              <span className="block font-bold text-slate-700">视频影院</span>
              <span className="block text-sm text-slate-500">看精彩故事</span>
            </span>
          </button>
          <button
            onClick={openShop}
            className="flex items-center gap-3 rounded-3xl bg-white/85 p-4 text-left shadow-lg ring-1 ring-white/60 transition hover:scale-[1.02] active:scale-[0.98]"
          >
            <Image src="/ui/locations/shop.webp" alt="" width={80} height={60} className="h-14 w-auto object-contain" />
            <span>
              <span className="block font-bold text-slate-700">星星商店</span>
              <span className="block text-sm text-slate-500">兑换小奖励</span>
            </span>
          </button>
        </div>

      </div>
    </main>
  );
}
