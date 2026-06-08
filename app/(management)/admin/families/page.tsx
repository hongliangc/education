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
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>家庭</h1>
      <p style={{ color: "#64748b", marginBottom: 16 }}>平台上的家长账号与他们的孩子（只读）。</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {families.map((family) => (
          <div
            key={family.id}
            style={{ padding: 16, borderRadius: 14, background: "#fff", border: "1px solid #f1f5f9" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600 }}>{family.email ?? family.phone ?? family.id}</span>
              {family.role === "ADMIN" && (
                <span style={{ fontSize: 12, color: "#b45309", background: "#fef3c7", padding: "1px 8px", borderRadius: 999 }}>
                  管理员
                </span>
              )}
            </div>
            {family.children.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {family.children.map((child) => (
                  <span
                    key={child.id}
                    style={{ padding: "4px 12px", borderRadius: 999, background: "#f8fafc", border: "1px solid #f1f5f9" }}
                  >
                    {child.avatar} {child.name}
                    <span style={{ marginLeft: 6, color: "#f59e0b", fontWeight: 700 }}>⭐ {child.totalStars}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ color: "#94a3b8", fontSize: 13 }}>还没有孩子</span>
            )}
          </div>
        ))}
        {families.length === 0 && <span style={{ color: "#94a3b8" }}>暂无家庭。</span>}
      </div>
    </div>
  );
}
