"use client";

import { useMemo, useState } from "react";
import { MathScene } from "@/components/games/math/MathScene";
import {
  buildArrayMul,
  buildBreakTenSub,
  buildMakeTenAdd,
  buildShareDiv,
  buildTenBondAdd,
  buildTenBondSub,
  type Storyboard,
} from "@/content/math/scene";

// Standalone preview (no game HUD) for evaluating every teaching-animation method before wiring
// them into the lessons. http://localhost/math-demo
type Method = {
  key: string;
  tab: string;
  title: string;
  blurb: string;
  sym: string;
  presets: Array<[number, number]>;
  build: (a: number, b: number) => Storyboard;
  table?: boolean; // show the 9×9 multiplication-table picker instead of preset buttons
};

const METHODS: Method[] = [
  {
    key: "addbond",
    tab: "10以内加法",
    title: "数的组成 · 10以内加法",
    blurb: "两部分放进十格，用数的组成看它们合成整体。",
    sym: "+",
    presets: [
      [5, 3],
      [4, 4],
      [6, 2],
      [3, 5],
      [7, 2],
    ],
    build: buildTenBondAdd,
  },
  {
    key: "subbond",
    tab: "10以内减法",
    title: "数的组成 · 10以内减法",
    blurb: "先放整体，拿走一部分，看它分成了哪两份。",
    sym: "-",
    presets: [
      [8, 3],
      [10, 4],
      [7, 2],
      [9, 5],
      [6, 1],
    ],
    build: buildTenBondSub,
  },
  {
    key: "maketen",
    tab: "进位加法",
    title: "凑十法 · 进位加法",
    blurb: "先把一个数凑成 10，再加上剩下的。",
    sym: "+",
    presets: [
      [8, 5],
      [7, 6],
      [9, 4],
      [6, 7],
      [5, 8],
    ],
    build: buildMakeTenAdd,
  },
  {
    key: "breakten",
    tab: "退位减法",
    title: "破十法 · 退位减法",
    blurb: "不够减就拆开十格，从 10 里拿走，再和外面的合起来。",
    sym: "-",
    presets: [
      [13, 5],
      [12, 8],
      [16, 9],
      [11, 4],
      [15, 7],
    ],
    build: buildBreakTenSub,
  },
  {
    key: "mul",
    tab: "表内乘法",
    title: "阵列 + 跳数 · 表内乘法",
    blurb: "一行一行摆成方阵，跳着数出一共多少。",
    sym: "×",
    presets: [
      [3, 4],
      [2, 6],
      [5, 5],
      [4, 3],
      [6, 2],
    ],
    build: buildArrayMul,
  },
  {
    key: "table",
    tab: "乘法表",
    title: "九九乘法表",
    blurb: "点任意一格，看那道乘法的阵列动画。",
    sym: "×",
    presets: [[3, 4]],
    build: buildArrayMul,
    table: true,
  },
  {
    key: "div",
    tab: "表内除法",
    title: "平均分 · 表内除法",
    blurb: "把总数一个一个发进篮子，每个篮子分到几个。",
    sym: "÷",
    presets: [
      [12, 3],
      [10, 5],
      [8, 4],
      [6, 2],
      [9, 3],
    ],
    build: buildShareDiv,
  },
];

export default function MathDemoPage() {
  const [methodKey, setMethodKey] = useState(METHODS[0].key);
  const method = METHODS.find((m) => m.key === methodKey) ?? METHODS[0];
  const [pair, setPair] = useState<[number, number]>(METHODS[0].presets[0]);
  const [a, b] = pair;
  const scene: Storyboard = useMemo(() => method.build(a, b), [method, a, b]);

  const pickMethod = (key: string) => {
    const next = METHODS.find((m) => m.key === key) ?? METHODS[0];
    setMethodKey(key);
    setPair(next.presets[0]);
  };

  return (
    <main className="mx-auto min-h-full max-w-xl px-4 py-8 font-[family-name:var(--font-kid)]">
      <header className="text-center">
        <p className="text-sm font-bold tracking-wide text-amber-500">演示 · 算术动画</p>
        <h1 className="mt-1 text-2xl font-black text-slate-800">{method.title}</h1>
        <p className="mt-2 text-sm text-slate-500">{method.blurb}</p>
      </header>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => pickMethod(m.key)}
            className={`rounded-full px-4 py-2 text-sm font-black shadow-sm transition-colors ${
              m.key === method.key
                ? "bg-amber-500 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-amber-50"
            }`}
          >
            {m.tab}
          </button>
        ))}
      </div>

      {method.table ? (
        <div className="mt-4 flex flex-col items-center gap-1">
          {Array.from({ length: 9 }, (_, ri) => {
            const i = ri + 1;
            return (
              <div key={i} className="flex gap-1">
                {Array.from({ length: i }, (_, cj) => {
                  const j = cj + 1;
                  const active = j === a && i === b;
                  return (
                    <button
                      key={j}
                      type="button"
                      onClick={() => setPair([j, i])}
                      className={`flex h-9 w-12 flex-col items-center justify-center rounded-md leading-none shadow-sm transition-colors ${
                        active ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50"
                      }`}
                    >
                      <span className="text-[10px] opacity-70">
                        {j}×{i}
                      </span>
                      <span className="text-sm font-black">{i * j}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {method.presets.map(([pa, pb]) => {
            const active = pa === a && pb === b;
            return (
              <button
                key={`${pa}-${pb}`}
                type="button"
                onClick={() => setPair([pa, pb])}
                className={`rounded-full px-4 py-2 text-base font-black shadow-sm transition-colors ${
                  active ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-sky-50"
                }`}
              >
                {pa} {method.sym} {pb}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <MathScene scene={scene} />
      </div>

      <p className="mt-6 text-center text-xs text-slate-400">
        随机题也能用同一套动画驱动（确定性 storyboard + framer-motion）。
      </p>
    </main>
  );
}
