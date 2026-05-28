"use client";

import { useEffect } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";

export function GameDone({
  starsEarned,
  correctQ,
  totalQ,
  onAgain,
  onClose,
}: {
  starsEarned: number;
  correctQ: number;
  totalQ: number;
  onAgain: () => void;
  onClose: () => void;
}) {
  const { sfx } = useSFX();
  useEffect(() => {
    sfx.fanfare();
  }, [sfx]);

  return (
    <div className="text-center py-6">
      <div className="text-7xl anim-pop-in">🎉</div>
      <h3 className="text-2xl font-bold text-slate-700 mt-3">闯关成功！</h3>
      <p className="text-slate-500 mt-1">
        答对 {correctQ} / {totalQ} 题
      </p>
      <div className="mt-4 text-4xl text-amber-500 anim-pulse-soft">
        {"⭐".repeat(Math.max(1, starsEarned))}
      </div>
      <p className="text-amber-600 mt-1 font-bold">获得 {starsEarned} 颗星 🌟</p>
      <div className="mt-6 flex gap-3 justify-center">
        <Btn variant="ghost" onClick={onClose}>
          回到地图
        </Btn>
        <Btn variant="primary" onClick={onAgain}>
          再来一次 🔁
        </Btn>
      </div>
    </div>
  );
}
