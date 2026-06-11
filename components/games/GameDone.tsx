"use client";

import { useEffect } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";

export function GameDone({
  starsEarned,
  correctQ,
  totalQ,
  gradeLabel,
  onAgain,
  onClose,
  onChangeMode,
  changeModeLabel = "换个模式",
}: {
  starsEarned: number;
  correctQ: number;
  totalQ: number;
  gradeLabel?: string;
  onAgain: () => void;
  onClose: () => void;
  onChangeMode?: () => void;
  changeModeLabel?: string;
}) {
  const { sfx } = useSFX();
  useEffect(() => {
    sfx.fanfare();
  }, [sfx]);

  return (
    <div className="text-center py-6">
      <div className="text-7xl anim-pop-in">🎉</div>
      <h3 className="text-2xl font-bold text-slate-700 mt-3">闯关成功！</h3>
      {gradeLabel ? (
        <p className="mt-1 text-sm font-bold text-sky-500">🎓 {gradeLabel}</p>
      ) : null}
      <p className="text-slate-500 mt-1">
        答对 {correctQ} / {totalQ} 题
      </p>
      <div className="mt-4 text-4xl text-amber-500 anim-pulse-soft">
        {"⭐".repeat(Math.max(1, starsEarned))}
      </div>
      <p className="text-amber-600 mt-1 font-bold">获得 {starsEarned} 颗星 🌟</p>
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        <Btn variant="ghost" onClick={onClose}>
          回到地图
        </Btn>
        {onChangeMode ? (
          <Btn variant="secondary" onClick={onChangeMode}>
            {changeModeLabel}
          </Btn>
        ) : null}
        <Btn variant="primary" onClick={onAgain}>
          再来一次 🔁
        </Btn>
      </div>
    </div>
  );
}
