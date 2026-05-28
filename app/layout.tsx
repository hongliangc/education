import type { Metadata } from "next";
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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${kidFont.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
