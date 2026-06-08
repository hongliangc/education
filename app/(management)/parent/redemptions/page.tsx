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
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>兑换审批</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>
        「待发放」的实物奖励发放后点「发放」；退回会把星星返还给孩子。
      </p>
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
