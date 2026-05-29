"use client";

import { useEffect } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";

export function StoryMoral({
  moral,
  onComplete,
}: {
  moral: string;
  onComplete: () => void;
}) {
  const { sfx } = useSFX();

  useEffect(() => {
    sfx.fanfare();
    speakText(moral, { lang: "zh-CN", rate: 0.9 });
  }, [moral, sfx]);

  return (
    <div className="text-center anim-pop-in py-4">
      <div className="text-6xl">🌟</div>
      <h3 className="text-2xl font-bold text-amber-700 mt-3">道理</h3>
      <p className="mt-3 text-lg text-slate-700 leading-relaxed">{moral}</p>
      <Btn variant="primary" onClick={onComplete} className="mt-6">
        完成 ✨
      </Btn>
    </div>
  );
}
