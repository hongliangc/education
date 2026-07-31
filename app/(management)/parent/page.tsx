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
    <div className="space-y-8">
      <header>
        <p className="mb-1 text-sm font-medium text-blue-600">家庭中心</p>
        <h1 className="text-2xl font-bold text-slate-950">家庭总览</h1>
        <p className="mt-2 text-sm text-slate-600">快速查看家庭奖励、兑换和孩子的星星。</p>
      </header>
      <section aria-label="家庭数据" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-500"
          >
            <span className="text-sm font-medium text-slate-600">{card.label}</span>
            <strong className="mt-2 block text-3xl font-bold" style={{ color: card.accent }}>
              {card.value}
            </strong>
            <span className="mt-3 block text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">查看详情 →</span>
          </Link>
        ))}
      </section>

      <section aria-labelledby="children-stars-title">
        <h2 id="children-stars-title" className="mb-3 text-lg font-bold text-slate-900">孩子的星星</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => (
          <div key={child.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="text-2xl" aria-hidden="true">{child.avatar}</span>
            <span className="min-w-0 flex-1 truncate font-semibold text-slate-900">{child.name}</span>
            <span className="font-bold text-amber-600"><span aria-hidden="true">⭐</span> {child.totalStars}</span>
          </div>
        ))}
        {children.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">还没有添加孩子，孩子账号创建后会显示在这里。</p>
        ) : null}
        </div>
      </section>
    </div>
  );
}
