"use client";

import { useMemo, useState } from "react";
import { MathScene } from "@/components/games/math/MathScene";
import { buildBreakTenSub, buildMakeTenAdd, type TenFrameScene } from "@/content/math/scene";

// Standalone demo (no game HUD) for evaluating the ten-frame practice animations
// (凑十法 进位加法 / 破十法 退位减法) before / alongside the in-lesson integration.
// http://localhost/math-demo
type Op = "+" | "-";
const PRESETS: Record<Op, Array<[number, number]>> = {
  "+": [
    [8, 5],
    [7, 6],
    [9, 4],
    [6, 7],
    [5, 8],
  ],
  "-": [
    [13, 5],
    [12, 8],
    [16, 9],
    [11, 4],
    [15, 7],
  ],
};

export default function MathDemoPage() {
  const [op, setOp] = useState<Op>("+");
  const [pair, setPair] = useState<[number, number]>(PRESETS["+"][0]);
  const [a, b] = pair;
  const scene: TenFrameScene = useMemo(
    () => (op === "+" ? buildMakeTenAdd(a, b) : buildBreakTenSub(a, b)),
    [op, a, b],
  );

  const pickOp = (next: Op) => {
    setOp(next);
    setPair(PRESETS[next][0]);
  };

  return (
    <main className="mx-auto min-h-full max-w-xl px-4 py-8 font-[family-name:var(--font-kid)]">
      <header className="text-center">
        <p className="text-sm font-bold tracking-wide text-amber-500">演示 · 算术动画</p>
        <h1 className="mt-1 text-2xl font-black text-slate-800">
          {op === "+" ? "凑十法 · 进位加法" : "破十法 · 退位减法"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {op === "+"
            ? "先把一个数凑成 10，再加上剩下的 —— 看小圆点跳进十格里。"
            : "不够减就拆开十格，从 10 里拿走，再和外面的合起来。"}
        </p>
      </header>

      <div className="mt-5 flex justify-center gap-2">
        {(["+", "-"] as const).map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => pickOp(o)}
            className={`rounded-full px-5 py-2 text-base font-black shadow-sm transition-colors ${
              op === o ? "bg-amber-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-amber-50"
            }`}
          >
            {o === "+" ? "进位加法" : "退位减法"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PRESETS[op].map(([pa, pb]) => {
          const active = pa === a && pb === b;
          return (
            <button
              key={`${pa}-${pb}`}
              type="button"
              onClick={() => setPair([pa, pb])}
              className={`rounded-full px-4 py-2 text-base font-black shadow-sm transition-colors ${
                active
                  ? "bg-sky-500 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50"
              }`}
            >
              {pa} {op} {pb}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <MathScene scene={scene} />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        随机题也能用同一套动画驱动（确定性 storyboard + framer-motion）。
      </p>
    </main>
  );
}
