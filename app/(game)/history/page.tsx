// app/(game)/history/page.tsx
// 上下五千年历史长卷入口页：竖牌分组的朝代封面长卷。
// 点击「三国」进入 /history/three-kingdoms，其余朝代敬请期待。
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { HistoryScroll } from "@/components/history/HistoryScroll";

export default function HistoryPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);

  useEffect(() => {
    if (!child) router.replace("/child-select");
  }, [child, router]);

  if (!child) return null;

  return <HistoryScroll />;
}
