// components/games/literature/QuoteDeckPlayer.tsx
// 名句卡组：每张卡「看 → 当场答一道题 → 下一张」，按答对数量得星（替换旧的「看完固定 +2 星」）。
"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { FairyChat } from "@/components/fairy/FairyChat";
import { useSFX } from "@/components/audio/useSFX";
import { speakChunks, stopSpeaking, type SpeechController } from "@/lib/speech";
import type { QuoteCard, QuoteDeck } from "@/content/classics/types";
import type { StoryQuestion as StoryQuestionData } from "@/content/storybooks/types";
import type { SessionResult } from "@/components/games/types";
import { StoryQuestion } from "@/components/games/story/StoryQuestion";
import { startQuestionNarration } from "@/components/games/story/questionNarration";
import { questionSpeechText } from "@/components/games/story/questionSpeech";
import { QuoteCardView } from "./QuoteCardView";

type Phase = "card" | "question";

// 把当前卡拼成「接地内容」喂给精灵，让它贴着孩子正在看的这句作答。
function buildContext(deck: QuoteDeck, c: QuoteCard): string {
  const glossary = (c.glossary ?? [])
    .map((g) => `${g.term}（${g.kind}）：${g.explain}`)
    .join("；");
  return [
    `${deck.philosopher}${deck.source}里的名句：「${c.text}」（${c.pinyin}）`,
    `意思：${c.meaning}`,
    `解读：${c.interpretation}`,
    c.example ? `生活小例子：${c.example}` : "",
    glossary ? `字词典故：${glossary}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// 「经典解读」开场指令：让精灵先主动把这句名句讲清楚（结合道理与典故），再邀请孩子接着聊。
function openingPrompt(deck: QuoteDeck, c: QuoteCard): string {
  return `请像跟小朋友聊天一样，讲讲「${c.text}」这句话的意思。先用简单的话说清楚它讲的是什么道理，再结合${deck.philosopher}的想法和相关的小故事或典故帮我理解，别太长。最后轻轻问我一句，看我懂了没、想不想接着聊。`;
}

export function QuoteDeckPlayer({
  deck,
  child,
  onComplete,
}: {
  deck: QuoteDeck;
  child: { name: string; age?: number; totalStars?: number };
  onComplete: (r: SessionResult) => void;
}) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("card");
  const [correct, setCorrect] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const qSpeechRef = useRef<SpeechController | null>(null);
  const card = deck.cards[i];
  const total = deck.cards.length;

  // 离开时停掉题目朗读
  useEffect(
    () => () => {
      qSpeechRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const narrate = (q: StoryQuestionData) => {
    qSpeechRef.current?.stop();
    qSpeechRef.current = startQuestionNarration(speakChunks, questionSpeechText(q));
  };

  const stars = (c: number) => (c === total ? 3 : c >= total - 1 ? 2 : 1);

  // 看完这张卡 → 当场作答
  const startQuiz = () => {
    sfx.pageFlip();
    setPhase("question");
    narrate(card.question);
  };

  // 答完一题：累计对错，翻下一张；最后一张答完结算得星。
  const onAnswered = (ok: boolean) => {
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    qSpeechRef.current?.stop();
    if (i + 1 >= total) {
      stopSpeaking();
      onComplete({
        score: total ? Math.round((nextCorrect / total) * 100) : 0,
        totalQ: total,
        correctQ: nextCorrect,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        starsEarned: stars(nextCorrect),
      });
    } else {
      setI((n) => n + 1);
      setPhase("card");
    }
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

      {phase === "card" ? (
        <>
          <QuoteCardView
            key={card.id}
            card={card}
            onInterpret={() => {
              sfx.click();
              setChatOpen(true);
            }}
          />
          <div className="mt-4 flex justify-end">
            <Btn variant="primary" onClick={startQuiz}>
              我来答题 →
            </Btn>
          </div>
        </>
      ) : (
        <StoryQuestion
          key={card.id}
          question={card.question}
          index={i}
          total={total}
          lastLabel="看完啦 ✓"
          onReplay={() => narrate(card.question)}
          onAnswered={onAnswered}
        />
      )}

      {chatOpen && (
        <FairyChat
          key={card.id}
          child={child}
          context={buildContext(deck, card)}
          opening={openingPrompt(deck, card)}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
}
