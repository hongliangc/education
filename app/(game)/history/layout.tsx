// 上下五千年历史板块布局：在所有 /history 路由间持续播放朝代歌背景，并提供右上角开关。
// BGM 挂在 layout（跨 /history ↔ /history/three-kingdoms 持续、不随页面切换重启）。
import type { ReactNode } from "react";
import { HistoryBgm } from "@/components/history/HistoryBgm";

export default function HistoryLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <HistoryBgm />
    </>
  );
}
