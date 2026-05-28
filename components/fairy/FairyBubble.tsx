"use client";

import { FairySprite, type FairyMood } from "./FairySprite";

export function FairyBubble({
  text,
  mood = "happy",
  side = "left",
}: {
  text: string;
  mood?: FairyMood;
  side?: "left" | "right";
}) {
  return (
    <div
      className={`flex items-end gap-2 anim-slide-up ${
        side === "right" ? "flex-row-reverse" : ""
      }`}
    >
      <FairySprite mood={mood} size={84} />
      <div
        className={`relative max-w-xs rounded-3xl bg-white/90 backdrop-blur px-4 py-3 shadow-lg ring-1 ring-white text-slate-700 ${
          side === "right" ? "rounded-br-md" : "rounded-bl-md"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-line">{text}</p>
      </div>
    </div>
  );
}
