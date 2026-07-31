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
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-violet-600">运营概览</p>
        <h1 className="text-2xl font-bold text-slate-950">平台总览</h1>
        <p className="mt-2 text-sm text-slate-600">查看平台当前需要处理的数据。</p>
      </header>
      <section aria-label="平台数据" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <span className="text-sm font-medium text-slate-600">{card.label}</span>
            <strong className="mt-2 block text-3xl font-bold" style={{ color: card.accent }}>{card.value}</strong>
          </Link>
        ))}
      </section>
    </div>
  );
}
