import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          borderRadius: 12,
          colorPrimary: "#2563eb",
          colorText: "#0f172a",
          controlHeight: 44,
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
