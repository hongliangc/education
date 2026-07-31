import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listManagedRedemptions } from "@/lib/rewards/management";
import { RedemptionTable } from "@/components/management/RedemptionTable";

export default async function ParentRedemptionsPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor) redirect("/login");

  const redemptions = await listManagedRedemptions(actor);

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-blue-600">待办事项</p>
        <h1 className="text-2xl font-bold text-slate-950">兑换审批</h1>
        <p className="mt-2 text-sm text-slate-600">「待发放」的实物奖励发放后点「发放」；退回会把星星返还给孩子。</p>
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
        baseUrl="/api/parent/redemptions"
      />
    </div>
  );
}
