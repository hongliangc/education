// app/(game)/shop/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { useSFX } from "@/components/audio/useSFX";
import { BackButton } from "@/components/BackButton";
import { RedeemError, fetchRewardCatalog, redeemRewardResource } from "@/lib/rewards/client";
import { RewardCard, type ShopReward } from "@/components/shop/RewardCard";
import { MyRedemptions, type MyRedemptionItem } from "@/components/shop/MyRedemptions";

interface RawRedemption {
  id: string;
  status: string;
  starsSpent: number;
  createdAt: string;
  resource: { title: string; resourceType: string } | null;
}

export default function ShopPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const setStars = useGameStore((s) => s.setStars);
  const { sfx } = useSFX();
  const [rewards, setRewards] = useState<ShopReward[]>([]);
  const [balance, setBalance] = useState(child?.totalStars ?? 0);
  const [mine, setMine] = useState<MyRedemptionItem[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async (childId: string) => {
    const [catalog, redemptionsRes] = await Promise.all([
      fetchRewardCatalog(childId),
      fetch(`/api/rewards/redemptions?childId=${encodeURIComponent(childId)}`),
    ]);
    setBalance(catalog.balance);
    setRewards(
      catalog.rewards.map((r) => ({
        resourceId: r.resourceId,
        title: r.title,
        description: r.description,
        imageUrl: r.imageUrl,
        starsCost: r.starsCost,
        stock: r.stock,
      })),
    );
    if (redemptionsRes.ok) {
      const j = await redemptionsRes.json();
      setMine(
        (j.redemptions ?? [])
          .filter((x: RawRedemption) => x.resource?.resourceType === "REWARD")
          .map((x: RawRedemption) => ({
            id: x.id,
            status: x.status,
            starsSpent: x.starsSpent,
            createdAt: x.createdAt,
            resource: x.resource,
          })),
      );
    }
  };

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    load(child.id).catch(() => setNotice("商店暂时打不开，待会儿再试"));
  }, [child, router]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  if (!child) return null;

  const redeem = async (reward: ShopReward) => {
    setBusyId(reward.resourceId);
    try {
      const out = await redeemRewardResource(reward.resourceId, child.id);
      setBalance(out.balance);
      setStars(out.balance);
      sfx.click();
      setNotice(`兑换成功！「${reward.title}」已交给家长发放 🎉`);
      await load(child.id);
    } catch (error) {
      if (error instanceof RedeemError) {
        setNotice(
          error.code === "insufficient_stars"
            ? `还差 ${error.needed ?? 0} 颗星星`
            : error.code === "out_of_stock"
              ? "这个奖励被抢光啦"
              : "兑换失败，再试一次",
        );
      } else {
        setNotice("兑换失败，再试一次");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-5xl mx-auto">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <BackButton label="返回世界" onClick={() => { sfx.click(); router.push("/world"); }} />
          <h1 className="text-2xl font-bold text-white drop-shadow">🏪 星星商店</h1>
          <span className="ml-auto rounded-full bg-white/85 px-4 py-2 font-bold text-amber-500 shadow">
            ⭐ {balance}
          </span>
        </header>

        {notice && (
          <p className="mb-4 anim-slide-up rounded-2xl bg-white/90 px-4 py-2 text-center text-sm font-bold text-purple-600 ring-1 ring-white/60">
            {notice}
          </p>
        )}

        {rewards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.resourceId}
                reward={reward}
                balance={balance}
                busy={busyId === reward.resourceId}
                onRedeem={() => redeem(reward)}
              />
            ))}
          </div>
        ) : (
          <p className="rounded-3xl bg-white/80 p-6 text-center font-bold text-slate-500">
            家长还没有上架奖励哦，先去玩游戏多攒星星吧 ✨
          </p>
        )}

        <h2 className="mb-2 mt-8 px-1 text-xl font-bold text-white/90 drop-shadow">我的兑换</h2>
        <MyRedemptions items={mine} />
      </div>
    </main>
  );
}
