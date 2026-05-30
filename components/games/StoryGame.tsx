"use client";

import { useEffect, useRef, useState } from "react";
import { stopSpeaking } from "@/lib/speech";
import { STORIES } from "@/content/stories";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";
import { StoryReader } from "./story/StoryReader";
import { StoryQuestion } from "./story/StoryQuestion";
import { StoryMoral } from "./story/StoryMoral";

type Phase = "reading" | "question" | "moral" | "done";

export function StoryGame({
  onComplete,
  onExit,
}: {
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [storyIdx, setStoryIdx] = useState(0);
  const story = STORIES[storyIdx];
  const [phase, setPhase] = useState<Phase>("reading");
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());

  useEffect(() => () => stopSpeaking(), []);

  const resetStory = (nextIdx: number) => {
    setStoryIdx(nextIdx);
    setPhase("reading");
    setQi(0);
    setCorrectQ(0);
    startedAt.current = Date.now();
  };

  const stars = (correct: number) =>
    correct === story.questions.length
      ? 3
      : correct >= story.questions.length - 1
      ? 2
      : 1;

  if (phase === "done") {
    return (
      <GameDone
        starsEarned={stars(correctQ)}
        correctQ={correctQ}
        totalQ={story.questions.length}
        onAgain={() => resetStory((storyIdx + 1) % STORIES.length)}
        onClose={onExit}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xl font-bold text-slate-700">
          {story.emoji} {story.title}
        </h3>
        <select
          value={storyIdx}
          onChange={(e) => {
            stopSpeaking();
            resetStory(Number(e.target.value));
          }}
          className="rounded-xl ring-1 ring-slate-200 px-3 py-1 text-sm bg-white"
          aria-label="选择故事"
        >
          {STORIES.map((s, i) => (
            <option key={s.id} value={i}>
              {s.emoji} {s.title}
            </option>
          ))}
        </select>
      </div>

      {phase === "reading" && (
        <StoryReader story={story} onFinish={() => setPhase("question")} />
      )}

      {phase === "question" && (
        <StoryQuestion
          question={story.questions[qi]}
          index={qi}
          total={story.questions.length}
          onAnswered={(ok) => {
            if (ok) setCorrectQ((c) => c + 1);
            if (qi + 1 >= story.questions.length) {
              setPhase("moral");
            } else {
              setQi((i) => i + 1);
            }
          }}
        />
      )}

      {phase === "moral" && (
        <StoryMoral
          moral={story.moral}
          onComplete={() => {
            onComplete({
              score: correctQ * 33,
              totalQ: story.questions.length,
              correctQ,
              durationSec: Math.round(
                (Date.now() - startedAt.current) / 1000,
              ),
              starsEarned: stars(correctQ),
            });
            setPhase("done");
          }}
        />
      )}
    </div>
  );
}
