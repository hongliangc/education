"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { generateRound, type MathProblem } from "@/content/math";
import type { Grade } from "@/lib/grades";
import { getMistakes, mistakeToProblem } from "@/lib/math/mistakes";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";
import { MathRound } from "./math/MathRound";

type Screen = "round" | "done" | "review" | "review-done";

export function MathGame({
  childId,
  grade,
  onComplete,
  onExit,
}: {
  childId: string;
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("round");
  const [round, setRound] = useState<MathProblem[]>(() => generateRound(grade));
  const [mistakeCount, setMistakeCount] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());
  const gradeRef = useRef(grade);

  const refreshMistakes = useCallback(
    () => setMistakeCount(getMistakes(childId).length),
    [childId],
  );

  useEffect(() => {
    refreshMistakes();
  }, [refreshMistakes]);

  const startRound = useCallback(() => {
    setRound(generateRound(grade));
    setCorrectQ(0);
    startedAt.current = Date.now();
    setScreen("round");
  }, [grade]);

  // Restart with a fresh round whenever the parent switches the practice grade.
  useEffect(() => {
    if (gradeRef.current !== grade) {
      gradeRef.current = grade;
      startRound();
    }
  }, [grade, startRound]);

  const startReview = () => {
    const problems = getMistakes(childId).map(mistakeToProblem);
    if (problems.length === 0) return;
    setRound(problems);
    setCorrectQ(0);
    setScreen("review");
  };

  const finishRound = (correct: number) => {
    setCorrectQ(correct);
    const stars = Math.max(1, Math.round((correct / round.length) * 3));
    onComplete({
      score: correct * 10,
      totalQ: round.length,
      correctQ: correct,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      starsEarned: stars,
    });
    setScreen("done");
  };

  if (screen === "round") {
    return (
      <MathRound
        childId={childId}
        problems={round}
        review={false}
        onMistakesChanged={refreshMistakes}
        onFinish={finishRound}
      />
    );
  }

  if (screen === "review") {
    return (
      <MathRound
        childId={childId}
        problems={round}
        review
        onMistakesChanged={refreshMistakes}
        onFinish={(correct) => {
          setCorrectQ(correct);
          setScreen("review-done");
        }}
      />
    );
  }

  if (screen === "review-done") {
    return (
      <div className="py-8 text-center">
        <div className="text-7xl anim-pop-in">📕</div>
        <h3 className="mt-3 text-2xl font-bold text-slate-700">复习完成！</h3>
        <p className="mt-2 text-slate-500">
          答对 {correctQ} / {round.length} 题，答对的题已经移出错题本。
        </p>
        <Btn
          variant="primary"
          className="mt-6"
          onClick={() => {
            refreshMistakes();
            startRound();
          }}
        >
          继续练习
        </Btn>
      </div>
    );
  }

  const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
  return (
    <GameDone
      starsEarned={stars}
      correctQ={correctQ}
      totalQ={round.length}
      onAgain={startRound}
      onChangeMode={mistakeCount > 0 ? startReview : undefined}
      changeModeLabel={`复习错题 (${mistakeCount})`}
      onClose={onExit}
    />
  );
}
