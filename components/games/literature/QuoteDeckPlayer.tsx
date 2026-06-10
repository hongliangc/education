// components/games/literature/QuoteDeckPlayer.tsx
"use client";

import { useState } from "react";
import { Btn } from "@/components/Btn";
import { FairyChat } from "@/components/fairy/FairyChat";
import { useSFX } from "@/components/audio/useSFX";
import type { QuoteCard, QuoteDeck } from "@/content/classics/types";
import { QuoteCardView } from "./QuoteCardView";

const SUGGESTIONS = ["这句话讲啥呀？", "能举个例子吗？", "我该怎么做到呀？"];

// 把当前卡拼成「接地内容」喂给精灵，让它贴着孩子正在看的这句作答。
function buildContext(deck: QuoteDeck, c: QuoteCard): string {
  return [
    `${deck.philosopher}${deck.source}里的名句：「${c.text}」（${c.pinyin}）`,
    `意思：${c.meaning}`,
    `解读：${c.interpretation}`,
    c.example ? `生活小例子：${c.example}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function QuoteDeckPlayer({
  deck,
  child,
  onComplete,
}: {
  deck: QuoteDeck;
  child: { name: string; age?: number; totalStars?: number };
  onComplete: () => void;
}) {
  const [i, setI] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const { sfx } = useSFX();
  const card = deck.cards[i];
  const total = deck.cards.length;
  const isLast = i + 1 >= total;

  const prev = () => {
    sfx.click();
    setI((n) => Math.max(0, n - 1));
  };
  const next = () => {
    if (isLast) {
      onComplete();
      return;
    }
    sfx.pageFlip();
    setI((n) => Math.min(total - 1, n + 1));
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
        <span className="font-bold text-teal-700">
          {deck.emoji} {deck.title}
        </span>
        <span>
          {i + 1} / {total}
        </span>
      </div>

      <QuoteCardView
        key={card.id}
        card={card}
        onAskFairy={() => {
          sfx.click();
          setChatOpen(true);
        }}
      />

      <div className="mt-4 flex items-center justify-between gap-3">
        <Btn variant="ghost" onClick={prev} disabled={i === 0}>
          ← 上一张
        </Btn>
        <Btn variant="primary" onClick={next}>
          {isLast ? "看完啦 ✓" : "下一张 →"}
        </Btn>
      </div>

      {chatOpen && (
        <FairyChat
          child={child}
          context={buildContext(deck, card)}
          suggestions={SUGGESTIONS}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
