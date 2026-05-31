// components/games/story/ChapterReader.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { stopSpeaking } from "@/lib/speech";
import type { Chapter } from "@/content/storybooks/types";
import type { SessionResult } from "@/components/games/types";
import { StoryReader } from "./StoryReader";
import { StoryQuestion } from "./StoryQuestion";
import { StoryMoral } from "./StoryMoral";

type Phase = "reading" | "question" | "moral";

export function ChapterReader({
  chapter,
  onChapterComplete,
}: {
  chapter: Chapter;
  onChapterComplete: (r: SessionResult) => void;
}) {
  const [phase, setPhase] = useState<Phase>("reading");
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());

  // 切章时重置（父组件也会用 key 强制重挂，双保险）
  useEffect(() => {
    setPhase("reading");
    setQi(0);
    setCorrectQ(0);
    startedAt.current = Date.now();
  }, [chapter.idx]);

  useEffect(() => () => stopSpeaking(), []);

  const total = chapter.questions.length;
  const stars = (correct: number) =>
    correct === total ? 3 : correct >= total - 1 ? 2 : 1;

  return (
    <div>
      <h3 className="text-2xl font-bold text-slate-700 mb-3">
        {chapter.emoji} {chapter.title}
      </h3>

      {phase === "reading" && (
        <StoryReader
          key={chapter.idx}
          text={chapter.text}
          onFinish={() => setPhase("question")}
        />
      )}

      {phase === "question" && (
        <StoryQuestion
          question={chapter.questions[qi]}
          index={qi}
          total={total}
          onAnswered={(ok) => {
            if (ok) setCorrectQ((c) => c + 1);
            if (qi + 1 >= total) setPhase("moral");
            else setQi((i) => i + 1);
          }}
        />
      )}

      {phase === "moral" && (
        <StoryMoral
          moral={chapter.moral ?? "故事讲完啦，你真棒！"}
          onComplete={() => {
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
