"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Layout, Menu, Space, Tag, Typography } from "antd";
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
    <Layout style={{ minHeight: "100vh" }}>
      <Sider breakpoint="lg" collapsedWidth={0} theme="dark">
        <div
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: 700,
            padding: "20px 24px 12px",
          }}
        >
          魔法学习王国
        </div>
        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[activeMenuKey]}
          items={menuItems.map((item) => ({
            key: item.key,
            label: <Link href={item.href}>{item.label}</Link>,
          }))}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            alignItems: "center",
            background: "#fff",
            display: "flex",
            justifyContent: "space-between",
            paddingInline: 24,
          }}
        >
          <Typography.Title level={4} style={{ margin: 0 }}>
            {area === "admin" ? "平台管理后台" : "家长管理中心"}
          </Typography.Title>
          <Space>
            <Tag color={role === "ADMIN" ? "gold" : "blue"}>
              {role === "ADMIN" ? "管理员" : "家长"}
            </Tag>
            <Avatar>{displayName.slice(0, 1).toUpperCase()}</Avatar>
            <Typography.Text>{displayName}</Typography.Text>
          </Space>
        </Header>

        <Content style={{ margin: 24 }}>
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              minHeight: 280,
              padding: 24,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
