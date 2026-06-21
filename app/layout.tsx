import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ZCOOL_KuaiLe } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const kidFont = ZCOOL_KuaiLe({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-kid",
  display: "swap",
});

export const metadata: Metadata = {
  title: "魔法学习王国 · 3-10 岁儿童学习乐园",
  description: "AI 精灵陪伴的中文/英语/数学/写字/故事闯关学习平台",
  // 阿里云盘 video-preview CDN 对带页面 Referer 的请求做防盗链（403）。
  // hls.js 默认走 XhrLoader，XHR 无法按请求剥离 Referer（fetchSetup/referrerPolicy
  // 仅对 FetchLoader 生效），因此必须在文档级声明 no-referrer，让 XHR / fetch / 原生
  // <video> 的取流请求都不带 Referer。这是让默认加载器生效的唯一机制。
  referrer: "no-referrer",
};

// viewportFit:"cover" 让刘海/底部安全区由 env(safe-area-inset-*) 接管；
// 之前没有 viewport 导出，iPhone 上安全区不生效、内容被刘海/手势条遮挡。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#7dd3fc",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${kidFont.variable} h-full`}>
      <body className="min-h-full">
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
