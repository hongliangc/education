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
    <div className="space-y-8">
      <header>
        <p className="mb-1 text-sm font-medium text-violet-600">平台配置</p>
        <h1 className="text-2xl font-bold text-slate-950">资源与价格</h1>
        <p className="mt-2 text-sm text-slate-600">这里设置的是全平台默认值；家长可在自己的家庭里覆盖故事价格。首章永远免费。</p>
      </header>

      <section aria-labelledby="story-default-price-title" className="space-y-3">
        <h2 id="story-default-price-title" className="text-lg font-bold text-slate-900">故事默认价格</h2>
        <StoryPriceTable rows={prices} putUrl="/api/admin/story-prices" mode="platform" />
      </section>

      <section aria-labelledby="platform-rewards-title" className="space-y-3">
        <h2 id="platform-rewards-title" className="text-lg font-bold text-slate-900">平台奖励</h2>
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
      </section>
    </div>
  );
}
