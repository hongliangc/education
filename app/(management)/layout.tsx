import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          borderRadius: 10,
          colorPrimary: "#7c3aed",
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
