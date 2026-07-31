// app/(game)/history/page.tsx
// 上下五千年历史长卷入口页：竖牌分组的朝代封面长卷。
// 点击「三国」进入 /history/three-kingdoms，其余朝代敬请期待。
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { HistoryScroll } from "@/components/history/HistoryScroll";
import { showFairyGuide } from "@/lib/fairy-guide";

export default function HistoryPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);

  useEffect(() => {
    if (!child) router.replace("/child-select");
    else showFairyGuide({ event: "enter", text: "先点“展开长卷”，再从三国开始今天的历史冒险吧！", autoHideMs: 5600 });
  }, [child, router]);

  if (!child) return null;

  return <HistoryScroll />;
}
