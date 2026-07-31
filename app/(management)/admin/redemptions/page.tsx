import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listManagedRedemptions } from "@/lib/rewards/management";
import { RedemptionTable } from "@/components/management/RedemptionTable";

export default async function AdminRedemptionsPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor || actor.role !== "ADMIN") redirect("/parent");

  const redemptions = await listManagedRedemptions(actor);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-violet-600">平台审批</p>
        <h1 className="text-2xl font-bold text-slate-950">兑换记录</h1>
        <p className="mt-2 text-sm text-slate-600">全平台所有家庭的兑换记录，可直接发放或退回。</p>
      </header>
      <RedemptionTable
        rows={redemptions.map((r) => ({
          id: r.id,
          status: r.status,
          starsSpent: r.starsSpent,
          createdAt: r.createdAt.toISOString(),
          note: r.note,
          child: r.child,
          resource: r.resource,
        }))}
        baseUrl="/api/admin/redemptions"
      />
    </div>
  );
}
