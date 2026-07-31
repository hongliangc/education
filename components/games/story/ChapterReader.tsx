// components/games/story/ChapterReader.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { speakChunks, stopSpeaking, type SpeechController } from "@/lib/speech";
import type { Chapter } from "@/content/storybooks/types";
import type { SessionResult } from "@/components/games/types";
import { StoryPlayer } from "./StoryPlayer";
import { StoryQuestion } from "./StoryQuestion";
import { StoryMoral } from "./StoryMoral";
import { startQuestionNarration } from "./questionNarration";
import { questionSpeechText } from "./questionSpeech";
import { showFairyGuide } from "@/lib/fairy-guide";

type Phase = "reading" | "question" | "moral";

export function ChapterReader({
  chapter,
  onChapterComplete,
  fallbackImage,
}: {
  chapter: Chapter;
  onChapterComplete: (r: SessionResult) => void;
  fallbackImage?: string;
}) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());
  const questionSpeechRef = useRef<SpeechController | null>(null);

  // 切章时重置（父组件也会用 key 强制重挂，双保险）
  useEffect(() => {
    setPhase("reading");
    setQi(0);
    setCorrectQ(0);
    startedAt.current = Date.now();
  }, [chapter.idx]);

  useEffect(
    () => () => {
      questionSpeechRef.current?.stop();
      questionSpeechRef.current = null;
      stopSpeaking();
    },
    [],
  );

  const narrateQuestion = (index: number) => {
    questionSpeechRef.current?.stop();
    questionSpeechRef.current = startQuestionNarration(
      speakChunks,
      questionSpeechText(chapter.questions[index]),
    );
  };

  const total = chapter.questions.length;
  const progress =
    phase === "reading" ? 10 : phase === "question" ? 20 + ((qi + 1) / Math.max(1, total)) * 65 : 100;
  const phaseLabel = phase === "reading" ? "阅读故事" : phase === "question" ? `回答问题 ${qi + 1}/${total}` : "故事寓意";
  const stars = (correct: number) =>
    correct === total ? 3 : correct >= total - 1 ? 2 : 1;

  return (
    <div>
      <div className="mb-4 rounded-2xl bg-white/85 p-3 shadow-sm ring-1 ring-amber-100">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black text-slate-700 sm:text-2xl">
            {chapter.emoji} {chapter.title}
          </h3>
          <span className="shrink-0 text-xs font-bold text-amber-700">{phaseLabel}</span>
        </div>
        <div
          role="progressbar"
          aria-label="故事阅读进度"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-amber-100"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-amber-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {phase === "reading" && (
        <StoryPlayer
          key={chapter.idx}
          text={chapter.text}
          images={chapter.images ?? []}
          fallbackEmoji={chapter.emoji}
          fallbackImage={fallbackImage}
          onFinish={() => {
            narrateQuestion(0);
            setPhase("question");
          }}
        />
      )}

      {phase === "question" && (
        <StoryQuestion
          question={chapter.questions[qi]}
          index={qi}
          total={total}
          onReplay={() => narrateQuestion(qi)}
          onAnswered={(ok) => {
            showFairyGuide({
              event: ok ? "correct" : "incorrect",
              text: ok ? "答对啦！你把故事听得很认真。" : "没关系，再想想故事里发生了什么。",
              autoHideMs: 2600,
            });
            if (ok) setCorrectQ((c) => c + 1);
            if (qi + 1 >= total) setPhase("moral");
            else {
              narrateQuestion(qi + 1);
              setQi((i) => i + 1);
            }
          }}
        />
      )}

      {phase === "moral" && (
        <StoryMoral
          moral={chapter.moral ?? "故事讲完啦，你真棒！"}
          onComplete={() => {
            showFairyGuide({ event: "complete", text: "故事读完啦！你又收集到一份勇气和智慧。", autoHideMs: 4200 });
            onChapterComplete({
              score: correctQ * 33,
              totalQ: total,
              correctQ,
              durationSec: Math.round((Date.now() - startedAt.current) / 1000),
              starsEarned: stars(correctQ),
            });
          }}
        />
      )}
    </div>
  );
}
