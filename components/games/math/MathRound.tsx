"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import type { MathProblem } from "@/content/math";
import { addMistake, removeMistake, toMistake } from "@/lib/math/mistakes";
import { MathGuide } from "./MathGuide";
import { MathVisual } from "./MathVisual";

export function MathRound({
  childId,
  problems,
  review,
  onMistakesChanged,
  onFinish,
}: {
  childId: string;
  problems: MathProblem[];
  review: boolean;
  onMistakesChanged: () => void;
  onFinish: (correctQ: number) => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  // "wrong" = auto-shown after a miss (records a mistake on finish); "help" = on-demand 求助
  // peek that the child opens before answering (no mistake, returns to the choices).
  const [guideReason, setGuideReason] = useState<"wrong" | "help" | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sfx } = useSFX();
  const current = problems[questionIndex];
  const choices = current?.choices ?? [];

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const advance = useCallback(
    (wasCorrect: boolean) => {
      const nextCorrect = correctQ + (wasCorrect ? 1 : 0);
      setFeedback(null);
      setGuideReason(null);
      if (questionIndex + 1 >= problems.length) {
        onFinish(nextCorrect);
        return;
      }
      setCorrectQ(nextCorrect);
      setQuestionIndex((index) => index + 1);
    },
    [correctQ, onFinish, problems.length, questionIndex],
  );

  if (!current) return null;

  const choose = (choice: string) => {
    if (feedback) return;
    const correct = choice === current.answer;
    setFeedback(correct ? "correct" : "wrong");

    if (correct) {
      sfx.correct();
      if (review) {
        removeMistake(childId, current.id);
        onMistakesChanged();
      }
      timerRef.current = setTimeout(() => advance(true), 700);
      return;
    }

    sfx.wrong();
    timerRef.current = setTimeout(() => setGuideReason("wrong"), 450);
  };

  const finishGuide = () => {
    if (!review) {
      addMistake(childId, toMistake(current));
      onMistakesChanged();
    }
    advance(false);
  };

  // On-demand help: open the guided walkthrough before answering, then return to the choices.
  const requestHelp = () => {
    if (feedback || guideReason) return;
    sfx.click();
    setGuideReason("help");
  };
  const closeHelp = () => setGuideReason(null);

  return (
    <div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: `${(questionIndex / problems.length) * 100}%` }}
        />
      </div>

      <div
        className={`mt-5 rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-100 p-5 text-center anim-pop-in ${
          feedback === "correct" ? "anim-correct" : feedback === "wrong" ? "anim-shake" : ""
        }`}
      >
        <div className="text-3xl font-bold text-amber-700 sm:text-4xl">
          {current.prompt}
          {current.kind === "arithmetic" ? " = ?" : ""}
        </div>
        <div className="mt-5 min-h-24">
          <MathVisual problem={current} />
        </div>
      </div>

      {guideReason !== null ? (
        <>
          <MathGuide
            problem={current}
            onComplete={guideReason === "wrong" ? finishGuide : () => {}}
            autoPlay={guideReason === "wrong"}
          />
          {guideReason === "help" && (
            <div className="mt-3 text-center">
              <Btn size="sm" variant="primary" onClick={closeHelp}>
                ✏️ 我来试试
              </Btn>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {choices.map((choice) => (
              <Btn
                key={choice}
                size="lg"
                variant="primary"
                onClick={() => choose(choice)}
                disabled={feedback !== null}
                className="py-6 text-3xl"
              >
                {choice}
              </Btn>
            ))}
          </div>
          <div className="mt-3 text-center">
            <Btn size="sm" variant="ghost" onClick={requestHelp} disabled={feedback !== null}>
              🆘 求助
            </Btn>
          </div>
        </>
      )}

      <p className="mt-3 text-center text-sm text-slate-400">
        {review ? "错题复习 · " : ""}
        第 {questionIndex + 1} 题 / 共 {problems.length} 题
      </p>
    </div>
  );
}
