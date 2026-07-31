// components/games/literature/QuoteDeckPlayer.tsx
// 名句卡组：每张卡「看 → 当场答一道题 → 下一张」，按答对数量得星（替换旧的「看完固定 +2 星」）。
"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakChunks, stopSpeaking, type SpeechController } from "@/lib/speech";
import type { QuoteDeck } from "@/content/classics/types";
import type { StoryQuestion as StoryQuestionData } from "@/content/storybooks/types";
import type { SessionResult } from "@/components/games/types";
import { StoryQuestion } from "@/components/games/story/StoryQuestion";
import { startQuestionNarration } from "@/components/games/story/questionNarration";
import { questionSpeechText } from "@/components/games/story/questionSpeech";
import { QuoteCardView } from "./QuoteCardView";
import { showFairyGuide } from "@/lib/fairy-guide";

type Phase = "card" | "question";

export function QuoteDeckPlayer({
  deck,
  onComplete,
}: {
  deck: QuoteDeck;
  onComplete: (r: SessionResult) => void;
}) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("card");
  const [correct, setCorrect] = useState(0);
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
    qSpeechRef.current?.stop();
    stopSpeaking();
    setPhase("question");
    narrate(card.question);
  };

  const interpretCard = () => {
    sfx.click();
    qSpeechRef.current?.stop();
    stopSpeaking();
    qSpeechRef.current = speakChunks(card.interpretation, { lang: "zh-CN", rate: 0.9 });
  };

  // 答完一题：累计对错，翻下一张；最后一张答完结算得星。
  const onAnswered = (ok: boolean) => {
    showFairyGuide({
      event: ok ? "correct" : "incorrect",
      text: ok ? "理解得真好，这句话已经被你记住啦！" : "没关系，看看解释再想一次就会明白。",
      autoHideMs: 2600,
    });
    const nextCorrect = correct + (ok ? 1 : 0);
    setCorrect(nextCorrect);
    qSpeechRef.current?.stop();
    if (i + 1 >= total) {
      stopSpeaking();
      showFairyGuide({ event: "complete", text: "整组名句读完啦，今天的你很有智慧！", autoHideMs: 4200 });
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
            onInterpret={interpretCard}
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

    </div>
  );
}
