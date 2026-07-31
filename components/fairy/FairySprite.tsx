"use client";

import Image from "next/image";

export type FairyMood = "happy" | "thinking" | "excited" | "surprised";

type FairySpriteProps = {
  mood?: FairyMood;
  size?: number;
  animate?: boolean;
};

export function FairySprite({
  mood = "happy",
  size = 120,
  animate = true,
}: FairySpriteProps) {
  return (
    <span
      data-mood={mood}
      className={`relative inline-block shrink-0 ${animate ? "anim-fairy-float" : ""}`}
      style={{ width: size, height: Math.round(size * 1.36) }}
    >
      <Image
        src="/ui/mascot/fairy-guide.png"
        alt="小仙女小星"
        fill
        sizes={`${size}px`}
        className="object-contain drop-shadow-[0_10px_16px_rgba(126,34,206,.22)]"
      />
    </span>
  );
}
