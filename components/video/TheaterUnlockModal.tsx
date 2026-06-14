"use client";

import { Btn } from "@/components/Btn";
import { GameModal } from "@/components/GameModal";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";

interface TheaterUnlockModalProps {
  video: TheaterVideoItem;
  balance: number;
  loading: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TheaterUnlockModal({
  video,
  balance,
  loading,
  error,
  onCancel,
  onConfirm,
}: TheaterUnlockModalProps) {
  return (
    <GameModal
      title="解锁动画片"
      emoji="⭐"
      color="#f59e0b"
      onClose={() => {
        if (!loading) onCancel();
      }}
    >
      <div className="space-y-5 text-center">
        <div>
          <p className="text-lg font-black text-slate-700">
            用 {video.cost}⭐ 解锁《{video.title}》吗？
          </p>
          <p className="mt-2 text-sm font-bold text-slate-500">
            你现在有 {balance}⭐，解锁后可以一直重看。
          </p>
        </div>
        {error && (
          <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800">
            {error}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-3">
          <Btn variant="ghost" disabled={loading} onClick={onCancel}>
            返回
          </Btn>
          <Btn disabled={loading} onClick={onConfirm}>
            {loading ? "解锁中..." : "确认解锁"}
          </Btn>
        </div>
      </div>
    </GameModal>
  );
}
