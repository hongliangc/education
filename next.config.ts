import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WSL2 NAT 模式下从 Windows 用 WSL IP 访问 dev server 时，
  // 允许该来源加载 /_next/* 开发资源（否则客户端 JS 被跨源拦截，页面不可交互）。
  // 注：WSL IP 重启后可能变化；若变了把新 IP 加进来，或改用 mirrored 网络直接用 localhost。
  allowedDevOrigins: ["172.30.196.219"],
};

export default nextConfig;
