"use client";

import type { MathTier } from "@/content/math";

const TIERS: Array<{
  tier: MathTier;
  label: string;
  description: string;
  emoji: string;
  className: string;
}> = [
  {
    tier: "BASIC",
    label: "初级",
    description: "10 以内加减",
    emoji: "🍎",
    className: "from-emerald-100 to-lime-100 ring-emerald-300 text-emerald-800",
  },
  {
    tier: "MID",
    label: "中级",
    description: "100 以内加减",
    emoji: "🧮",
    className: "from-sky-100 to-cyan-100 ring-sky-300 text-sky-800",
  },
  {
    tier: "ADVANCED",
    label: "高级",
    description: "表内乘除",
    emoji: "🚀",
    className: "from-violet-100 to-fuchsia-100 ring-violet-300 text-violet-800",
  },
];

export function MathTierPicker({
  mistakeCount,
  onSelect,
  onReview,
}: {
  mistakeCount: number;
  onSelect: (tier: MathTier) => void;
  onReview: () => void;
}) {
  return (
    <div className="py-3">
      <div className="text-center">
        <div className="text-5xl">✨</div>
        <h3 className="mt-2 text-2xl font-bold text-slate-700">选择挑战难度</h3>
        <p className="mt-1 text-sm text-slate-500">每轮 5 题，慢慢想，你一定可以！</p>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {TIERS.map((item) => (
          <button
            key={item.tier}
            type="button"
            onClick={() => onSelect(item.tier)}
            className={`anim-pop-in rounded-3xl bg-gradient-to-br p-5 text-left shadow-sm ring-2 transition hover:-translate-y-1 hover:shadow-lg active:translate-y-0 ${item.className}`}
          >
            <span className="text-4xl" aria-hidden>
              {item.emoji}
            </span>
            <span className="ml-3 text-xl font-bold">{item.label}</span>
            <span className="mt-2 block text-sm font-medium opacity-80">{item.description}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onReview}
          disabled={mistakeCount === 0}
          className="relative anim-pop-in rounded-3xl bg-gradient-to-br from-rose-100 to-amber-100 p-5 text-left text-rose-800 shadow-sm ring-2 ring-rose-300 transition enabled:hover:-translate-y-1 enabled:hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mistakeCount > 0 ? (
            <span className="absolute right-4 top-4 rounded-full bg-rose-500 px-2.5 py-1 text-sm font-bold text-white">
              {mistakeCount}
            </span>
          ) : null}
          <span className="text-4xl" aria-hidden>
            📕
          </span>
          <span className="ml-3 text-xl font-bold">我的错题</span>
          <span className="mt-2 block text-sm font-medium opacity-80">
            {mistakeCount === 0 ? "暂无错题 🎉" : "再练一次，学会就会消失"}
          </span>
        </button>
      </div>
    </div>
  );
}
