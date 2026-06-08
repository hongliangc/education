"use client";

import { Btn } from "@/components/Btn";

export function UnlockConfirm({
  title,
  emoji,
  cost,
  balance,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  title: string;
  emoji: string;
  cost: number;
  balance: number;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const affordable = balance >= cost;
  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
      <div className="anim-pop-in w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 text-center">
        <div className="text-5xl">{emoji}</div>
        <h2 className="mt-2 text-xl font-bold text-slate-700">解锁《{title}》</h2>
        <p className="mt-3 text-slate-600">
          需要 <span className="font-bold text-amber-500">⭐{cost}</span>
        </p>
        <p className="text-sm text-slate-400">
          你有 ⭐{balance}
          {!affordable && <span className="text-rose-500"> · 还差 {cost - balance}</span>}
        </p>
        {error && <p className="mt-3 text-sm font-bold text-rose-500 anim-shake">{error}</p>}
        <div className="mt-5 flex gap-3 justify-center">
          <Btn variant="ghost" onClick={onCancel} disabled={busy}>
            再想想
          </Btn>
          <Btn variant="primary" onClick={onConfirm} disabled={busy || !affordable}>
            {busy ? "解锁中…" : "解锁 ▶"}
          </Btn>
        </div>
        {!affordable && (
          <p className="mt-3 text-xs text-slate-400">多玩游戏、读故事就能赚到更多星星哦 ✨</p>
        )}
      </div>
    </div>
  );
}
