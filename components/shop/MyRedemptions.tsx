"use client";

import { redemptionStatusLabel } from "@/lib/rewards/shop";

export interface MyRedemptionItem {
  id: string;
  status: string;
  starsSpent: number;
  createdAt: string;
  resource: { title: string; resourceType: string } | null;
}

export function MyRedemptions({ items }: { items: MyRedemptionItem[] }) {
  if (items.length === 0) {
    return <p className="text-center text-sm text-white/80">还没有兑换记录哦，快去挑一个奖励吧 ✨</p>;
  }
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-2xl bg-white/85 px-4 py-3 ring-1 ring-white/60"
        >
          <span className="text-xl">🎁</span>
          <span className="flex-1 font-bold text-slate-700">{item.resource?.title ?? "奖励"}</span>
          <span className="text-sm font-bold text-amber-500">⭐{item.starsSpent}</span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
            {redemptionStatusLabel(item.status)}
          </span>
        </div>
      ))}
    </div>
  );
}
