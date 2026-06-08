import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listRewards, listStoryPrices } from "@/lib/rewards/management";
import { StoryPriceTable } from "@/components/management/StoryPriceTable";
import { RewardEditor } from "@/components/management/RewardEditor";

const PLATFORM = { ownerType: "PLATFORM" as const, ownerId: null };

export default async function AdminResourcesPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor || actor.role !== "ADMIN") redirect("/parent");

  const [prices, rewards] = await Promise.all([
    listStoryPrices(PLATFORM),
    listRewards(PLATFORM),
  ]);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>资源与价格</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        这里设置的是全平台默认值；家长可在自己的家庭里覆盖故事价格。首章永远免费。
      </p>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "8px 0 12px" }}>故事默认价格</h2>
      <StoryPriceTable rows={prices} putUrl="/api/admin/story-prices" mode="platform" />

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "28px 0 12px" }}>平台奖励</h2>
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
        baseUrl="/api/admin/rewards"
      />
    </div>
  );
}
