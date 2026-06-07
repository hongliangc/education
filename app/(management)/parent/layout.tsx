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

const parentMenuItems: ManagementMenuItem[] = [
  { key: "parent-overview", label: "家庭总览", href: "/parent" },
  { key: "parent-rewards", label: "奖励与兑换", href: "/parent/rewards" },
  { key: "parent-pricing", label: "内容价格", href: "/parent/pricing" },
];

const adminParentMenuItem: ManagementMenuItem = {
  key: "admin-home",
  label: "平台管理",
  href: "/admin",
};

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user;
  const access = resolveManagementAccess(user, "parent");

  if (!access.allowed) {
    redirect(access.destination);
  }

  if (!user || !isManagementRole(user.role)) {
    redirect("/login");
  }

  const role = user.role;
  const displayName = user.name ?? user.email ?? "家长";
  const menuItems =
    role === "ADMIN" ? [...parentMenuItems, adminParentMenuItem] : parentMenuItems;

  return (
    <ManagementShell
      area="parent"
      role={role}
      displayName={displayName}
      selectedMenuKey="parent-overview"
      menuItems={menuItems}
    >
      {children}
    </ManagementShell>
  );
}
