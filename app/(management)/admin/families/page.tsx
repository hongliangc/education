import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { resolveRewardActor } from "@/lib/rewards/authorization";

export default async function AdminFamiliesPage() {
  const session = await auth();
  const actor = resolveRewardActor(session?.user);
  if (!actor || actor.role !== "ADMIN") redirect("/parent");

  const families = await prisma.user.findMany({
    where: { role: { in: ["PARENT", "ADMIN"] } },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      children: { select: { id: true, name: true, avatar: true, totalStars: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="mb-1 text-sm font-medium text-violet-600">账号目录</p>
        <h1 className="text-2xl font-bold text-slate-950">家庭</h1>
        <p className="mt-2 text-sm text-slate-600">平台上的家长账号与他们的孩子（只读）。</p>
      </header>

      <div className="space-y-3">
        {families.map((family) => (
          <article key={family.id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 break-all font-semibold text-slate-900">{family.email ?? family.phone ?? family.id}</h2>
              {family.role === "ADMIN" && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  管理员
                </span>
              )}
              <span className="text-xs text-slate-500">{family.children.length} 个孩子</span>
            </div>
            {family.children.length > 0 ? (
              <ul className="flex flex-wrap gap-2" aria-label="孩子列表">
                {family.children.map((child) => (
                  <li key={child.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                    {child.avatar} {child.name}
                    <span className="ml-2 font-bold text-amber-600">⭐ {child.totalStars}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">还没有孩子</p>
            )}
          </article>
        ))}
        {families.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">暂无家庭账号。</p> : null}
      </div>
    </div>
  );
}
