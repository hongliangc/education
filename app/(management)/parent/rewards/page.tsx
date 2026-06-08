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
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>奖励商店</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        设置孩子可以用星星兑换的家庭奖励，兑换后会进入「兑换审批」等你发放。
      </p>
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
