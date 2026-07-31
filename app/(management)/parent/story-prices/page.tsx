import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listStoryPrices } from "@/lib/rewards/management";
import { StoryPriceTable } from "@/components/management/StoryPriceTable";

export default async function ParentStoryPricesPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor) redirect("/login");

  const rows = await listStoryPrices({ ownerType: "FAMILY", ownerId: actor.id });

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-blue-600">阅读设置</p>
        <h1 className="text-2xl font-bold text-slate-950">故事价格</h1>
        <p className="mt-2 text-sm text-slate-600">留空表示沿用平台默认价；每本书的第一章永远免费。</p>
      </header>
      <StoryPriceTable rows={rows} putUrl="/api/parent/story-prices" mode="family" />
    </div>
  );
}
