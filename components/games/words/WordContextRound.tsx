"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { generateChallenges, type WordChallenge } from "@/content/words";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { showFairyGuide } from "@/lib/fairy-guide";

const ROUND_SIZE = 5;

// Primary-grade round: read or hear the prompt, then choose the matching picture or word
// (design §4.3 — G1 English/listening, G2 phrase, G3 sentence context).
export function WordContextRound({
  grade,
  onComplete,
  onExit,
}: {
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [round, setRound] = useState<WordChallenge[]>(() => generateChallenges(grade, ROUND_SIZE));
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const question = round[qi];

  const replay = useCallback(() => {
    if (question?.speak) speakText(question.speak.text, { lang: question.speak.lang, rate: 0.85 });
  }, [question]);

  // Read each new challenge aloud as it appears (the English word, phrase or sentence).
  useEffect(() => {
    if (question?.speak) speakText(question.speak.text, { lang: question.speak.lang, rate: 0.9 });
  }, [question]);

  const restart = () => {
    setRound(generateChallenges(grade, ROUND_SIZE));
    setQi(0);
    setCorrectQ(0);
    setFeedback(null);
    setDone(false);
    startedAt.current = Date.now();
  };

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={round.length}
        gradeLabel={GRADE_LABELS[grade]}
        onAgain={restart}
        onClose={onExit}
      />
    );
  }

  if (!question) return null;

  const choose = (choiceId: string) => {
    if (feedback) return;
    const ok = choiceId === question.answerId;
    setFeedback(ok ? "correct" : "wrong");
    showFairyGuide({
      event: ok ? "correct" : "incorrect",
      text: ok ? "选对啦！把这个词再读一遍。" : "再听一次，想想这个词在句子里的意思。",
      autoHideMs: 3400,
    });
    if (ok) {
      sfx.correct();
      setCorrectQ((c) => c + 1);
    } else sfx.wrong();
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= round.length) {
        const correct = ok ? correctQ + 1 : correctQ;
        const stars = Math.max(1, Math.round((correct / round.length) * 3));
        onComplete({
          score: correct * 20,
          totalQ: round.length,
          correctQ: correct,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
          starsEarned: stars,
        });
        showFairyGuide({
          event: "complete",
          text: `词语闯关完成！答对 ${correct} 题，获得 ${stars} 颗星。`,
          autoHideMs: 6000,
        });
        setDone(true);
      } else {
        setQi((i) => i + 1);
      }
    }, 800);
  };

  const isEmoji = question.choiceMode === "emoji";

  return (
    <div className="mx-auto max-w-3xl">
      <ProgressBar value={qi / round.length} />

      <div className="mt-5 flex min-h-20 items-center justify-center gap-3 rounded-3xl bg-sky-50 px-4 py-3 ring-1 ring-sky-100">
        <p className="text-center text-2xl font-bold text-slate-700">{question.prompt}</p>
        <button
          onClick={replay}
          aria-label="再听一次"
          className="shrink-0 rounded-full bg-sky-100 px-3 py-1 text-xl ring-2 ring-sky-200 hover:bg-sky-200"
        >
          🔊
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {question.choices.map((choice) => {
          const isAnswer = choice.id === question.answerId;
          return isEmoji ? (
            <button
              key={choice.id}
              onClick={() => choose(choice.id)}
              disabled={!!feedback}
              aria-label={`选择：${choice.label}`}
              className={`min-h-28 rounded-2xl py-5 text-4xl shadow ring-2 transition ${
                feedback && isAnswer
                  ? "bg-emerald-100 ring-emerald-300 anim-correct"
                  : "bg-white ring-sky-200 hover:bg-sky-50"
              }`}
            >
              <span aria-hidden="true">{choice.emoji}</span>
              <span className="mt-1 block text-sm font-black text-slate-700">{choice.label}</span>
            </button>
          ) : (
            <Btn
              key={choice.id}
              size="lg"
              variant={feedback === "correct" && isAnswer ? "secondary" : "primary"}
              onClick={() => choose(choice.id)}
              disabled={!!feedback}
              className="py-5 text-xl"
            >
              {choice.label}
            </Btn>
          );
        })}
      </div>

      <p className="mt-4 text-center text-sm text-slate-400">
        第 {qi + 1} 题 / 共 {round.length} 题
      </p>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all"
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
}
