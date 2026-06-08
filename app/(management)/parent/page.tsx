import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveRewardActor } from "@/lib/rewards/authorization";
import { listManagedRedemptions, listRewards } from "@/lib/rewards/management";

export default async function ParentOverviewPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor) redirect("/login");

  const owner = { ownerType: "FAMILY" as const, ownerId: actor.id };
  const [pending, rewards, children] = await Promise.all([
    listManagedRedemptions(actor, "PENDING_FULFILLMENT"),
    listRewards(owner),
    prisma.child.findMany({
      where: { parentId: actor.id },
      select: { id: true, name: true, totalStars: true, avatar: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const cards = [
    { label: "待发放兑换", value: pending.length, href: "/parent/redemptions", accent: "#f59e0b" },
    { label: "家庭奖励", value: rewards.filter((r) => r.isActive).length, href: "/parent/rewards", accent: "#10b981" },
    { label: "孩子", value: children.length, href: "/parent", accent: "#8b5cf6" },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>家庭总览</h1>
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

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: "28px 0 12px" }}>孩子的星星</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        {children.map((child) => (
          <div
            key={child.id}
            style={{ padding: "12px 18px", borderRadius: 14, background: "#fff", border: "1px solid #f1f5f9" }}
          >
            <span style={{ fontSize: 20, marginRight: 8 }}>{child.avatar}</span>
            <span style={{ fontWeight: 600 }}>{child.name}</span>
            <span style={{ marginLeft: 10, color: "#f59e0b", fontWeight: 700 }}>⭐ {child.totalStars}</span>
          </div>
        ))}
        {children.length === 0 && <span style={{ color: "#94a3b8" }}>还没有添加孩子。</span>}
      </div>
    </div>
  );
}
