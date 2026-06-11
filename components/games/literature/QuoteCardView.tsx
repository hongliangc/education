// components/games/literature/QuoteCardView.tsx
"use client";

import Image from "next/image";
import { Btn } from "@/components/Btn";
import type { QuoteCard } from "@/content/classics/types";
import { GlossaryNotes } from "./GlossaryNotes";

// 单张名句卡：原句 / 拼音 / 配图或 emoji / 白话 / 解读 / 生活小例子 / 字词典故 / 「经典解读」。
export function QuoteCardView({
  card,
  onInterpret,
}: {
  card: QuoteCard;
  onInterpret: () => void;
}) {
  return (
    <div className="anim-pop-in rounded-3xl bg-gradient-to-b from-teal-50 to-white p-5 ring-1 ring-teal-100 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner ring-1 ring-teal-100">
        {card.image ? (
          <Image
            src={card.image}
            alt={card.text}
            width={96}
            height={96}
            className="rounded-full object-cover"
          />
        ) : (
          <span className="text-6xl">{card.emoji}</span>
        )}
      </div>

      <h2 className="mt-4 text-3xl font-bold tracking-wide text-slate-800">
        {card.text}
      </h2>
      <p className="mt-1 text-sm text-slate-400">{card.pinyin}</p>

      <p className="mt-4 text-lg font-bold text-teal-700">{card.meaning}</p>
      <p className="mt-2 text-left text-base leading-relaxed text-slate-600">
        {card.interpretation}
      </p>

      {card.example && (
        <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-700 ring-1 ring-amber-100">
          🌟 小例子：{card.example}
        </div>
      )}

      {card.glossary && card.glossary.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer list-none text-left text-sm font-bold text-teal-700">
            🔎 字词典故
            <span className="ml-1 text-xs font-normal text-slate-400 group-open:hidden">
              （点开看）
            </span>
          </summary>
          <GlossaryNotes notes={card.glossary} />
        </details>
      )}

      <Btn variant="primary" className="mt-5" onClick={onInterpret}>
        💬 经典解读
      </Btn>
    </div>
  );
}
