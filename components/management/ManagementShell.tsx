"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Layout, Menu, Tag } from "antd";
import type { ManagementArea, ManagementRole } from "@/lib/auth/management";
import { resolveSelectedMenuKey } from "@/components/management/menuSelection";

const { Content, Header, Sider } = Layout;

export type ManagementMenuItem = {
  key: string;
  label: string;
  href: string;
};

type ManagementShellProps = {
  children: React.ReactNode;
  area: ManagementArea;
  role: ManagementRole;
  displayName: string;
  selectedMenuKey: string;
  menuItems: ManagementMenuItem[];
};

export function ManagementShell({
  children,
  area,
  role,
  displayName,
  selectedMenuKey,
  menuItems,
}: ManagementShellProps) {
  const pathname = usePathname();
  const activeMenuKey = resolveSelectedMenuKey(
    pathname,
    menuItems,
    selectedMenuKey,
  );

  return (
    <Layout className="management-shell min-h-screen">
      <Sider className="hidden! lg:block!" theme="dark" width={240}>
        <div className="px-6 pb-3 pt-6 text-lg font-bold text-white">
          <span aria-hidden="true">✦ </span>魔法学习王国
        </div>
        <nav aria-label="管理导航">
          <Menu
            mode="inline"
            theme="dark"
            selectedKeys={[activeMenuKey]}
            items={menuItems.map((item) => ({
              key: item.key,
              label: (
                <Link
                  href={item.href}
                  aria-current={activeMenuKey === item.key ? "page" : undefined}
                >
                  {item.label}
                </Link>
              ),
            }))}
          />
        </nav>
        <Link
          href="/world"
          className="mx-4 mt-6 flex min-h-11 items-center rounded-xl border border-white/15 px-4 text-sm font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          ← 返回儿童端
        </Link>
      </Sider>

      <Layout className="min-w-0 bg-slate-100">
        <Header
          className="management-header flex h-auto min-h-16 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-6"
          style={{ background: "#fff" }}
        >
          <p className="m-0 min-w-0 truncate text-base font-bold text-slate-900 sm:text-lg">
            {area === "admin" ? "平台管理后台" : "家长管理中心"}
          </p>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Tag color={role === "ADMIN" ? "gold" : "blue"}>
              {role === "ADMIN" ? "管理员" : "家长"}
            </Tag>
            <Avatar>{displayName.slice(0, 1).toUpperCase()}</Avatar>
            <span className="hidden max-w-48 truncate text-sm text-slate-600 sm:inline">
              {displayName}
            </span>
          </div>
        </Header>

        <nav
          aria-label="移动管理导航"
          className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden"
        >
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={activeMenuKey === item.key ? "page" : undefined}
              className={`flex min-h-11 shrink-0 items-center rounded-xl px-4 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-blue-500 ${
                activeMenuKey === item.key
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Content className="min-w-0 p-3 sm:p-5 lg:p-6">
          <main className="mx-auto min-h-72 max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            {children}
          </main>
        </Content>
      </Layout>
    </Layout>
  );
}
