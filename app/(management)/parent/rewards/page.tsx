import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listRewards } from "@/lib/rewards/management";
import { RewardEditor } from "@/components/management/RewardEditor";

export default async function ParentRewardsPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor) redirect("/login");

  const rewards = await listRewards({ ownerType: "FAMILY", ownerId: actor.id });

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-blue-600">家庭奖励</p>
        <h1 className="text-2xl font-bold text-slate-950">奖励商店</h1>
        <p className="mt-2 text-sm text-slate-600">设置孩子可以用星星兑换的家庭奖励，兑换后会进入「兑换审批」等你发放。</p>
      </header>
      <RewardEditor
        rewards={rewards.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          imageUrl: r.imageUrl,
          starsCost: r.starsCost,
          stock: r.stock,
          isActive: r.isActive,
        }))}
        baseUrl="/api/parent/rewards"
      />
    </div>
  );
}
