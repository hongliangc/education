import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listManagedRedemptions, listRewards } from "@/lib/rewards/management";

export default async function AdminOverviewPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor || actor.role !== "ADMIN") redirect("/parent");

  const [pending, rewards, families, children] = await Promise.all([
    listManagedRedemptions(actor, "PENDING_FULFILLMENT"),
    listRewards({ ownerType: "PLATFORM", ownerId: null }),
    prisma.user.count({ where: { role: { in: ["PARENT", "ADMIN"] } } }),
    prisma.child.count(),
  ]);

  const cards = [
    { label: "待发放兑换", value: pending.length, href: "/admin/redemptions", accent: "#f59e0b" },
    { label: "平台奖励", value: rewards.filter((r) => r.isActive).length, href: "/admin/resources", accent: "#10b981" },
    { label: "家庭", value: families, href: "/admin/families", accent: "#8b5cf6" },
    { label: "孩子", value: children, href: "/admin/families", accent: "#3b82f6" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>平台总览</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            style={{
              display: "block",
              padding: 20,
              borderRadius: 16,
              background: "#fff",
              border: "1px solid #f1f5f9",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ color: "#64748b", fontSize: 14 }}>{card.label}</div>
            <div style={{ color: card.accent, fontSize: 32, fontWeight: 700 }}>{card.value}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
