"use client";

import { Btn } from "@/components/Btn";
import { stockLabel } from "@/lib/rewards/shop";

export interface ShopReward {
  resourceId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  starsCost: number;
  stock: number | null;
}

export function RewardCard({
  reward,
  balance,
  busy,
  onRedeem,
}: {
  reward: ShopReward;
  balance: number;
  busy: boolean;
  onRedeem: () => void;
}) {
  const soldOut = reward.stock !== null && reward.stock <= 0;
  const affordable = balance >= reward.starsCost && !soldOut;
  return (
    <div className="flex flex-col rounded-3xl bg-white/90 backdrop-blur p-4 shadow ring-1 ring-white/60">
      {reward.imageUrl ? (
        <div
          className="mx-auto h-16 w-16 rounded-2xl bg-cover bg-center ring-1 ring-slate-200"
          style={{ backgroundImage: `url(${reward.imageUrl})` }}
        />
      ) : (
        <div className="text-center text-5xl">🎁</div>
      )}
      <div className="mt-2 text-center font-bold text-slate-700">{reward.title}</div>
      {reward.description && (
        <div className="mt-1 text-center text-xs text-slate-500">{reward.description}</div>
      )}
      <div className="mt-2 flex items-center justify-center gap-2 text-sm">
        <span className="font-bold text-amber-500">⭐ {reward.starsCost}</span>
        <span className="text-slate-400">· {stockLabel(reward.stock)}</span>
      </div>
      <Btn
        variant="primary"
        size="sm"
        className="mt-3"
        disabled={!affordable || busy}
        onClick={onRedeem}
      >
        {soldOut ? "已抢光" : busy ? "兑换中…" : affordable ? "兑换" : "星星不够"}
      </Btn>
    </div>
  );
}
