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
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>故事价格</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        留空表示沿用平台默认价；每本书的第一章永远免费。
      </p>
      <StoryPriceTable rows={rows} putUrl="/api/parent/story-prices" mode="family" />
    </div>
  );
}
