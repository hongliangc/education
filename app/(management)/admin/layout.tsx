import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  isManagementRole,
  resolveManagementAccess,
} from "@/lib/auth/management";
import {
  ManagementShell,
  type ManagementMenuItem,
} from "@/components/management/ManagementShell";

const adminMenuItems: ManagementMenuItem[] = [
  { key: "admin-overview", label: "平台总览", href: "/admin" },
  { key: "admin-resources", label: "资源与价格", href: "/admin/resources" },
  { key: "admin-redemptions", label: "兑换记录", href: "/admin/redemptions" },
  { key: "admin-families", label: "家庭", href: "/admin/families" },
  { key: "parent-home", label: "家长视图", href: "/parent" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const access = resolveManagementAccess(user, "admin");

  if (!access.allowed) {
    redirect(access.destination);
  }

  if (!user || !isManagementRole(user.role)) {
    redirect("/login");
  }

  return (
    <ManagementShell
      area="admin"
      role={user.role}
      displayName={user.name ?? user.email ?? "管理员"}
      selectedMenuKey="admin-overview"
      menuItems={adminMenuItems}
    >
      {children}
    </ManagementShell>
  );
}
