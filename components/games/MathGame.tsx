"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { generateRound, type MathProblem, type MathTier } from "@/content/math";
import { getMistakes, mistakeToProblem } from "@/lib/math/mistakes";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";
import { MathRound } from "./math/MathRound";
import { MathTierPicker } from "./math/MathTierPicker";

type Screen = "picker" | "round" | "done" | "review" | "review-done";

export function MathGame({
  childId,
  onComplete,
  onExit,
}: {
  childId: string;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("picker");
  const [tier, setTier] = useState<MathTier | null>(null);
  const [round, setRound] = useState<MathProblem[]>([]);
  const [mistakeCount, setMistakeCount] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());

  const refreshMistakes = () => setMistakeCount(getMistakes(childId).length);

  useEffect(() => {
    refreshMistakes();
  }, [childId]);

  const startTier = (nextTier: MathTier) => {
    setTier(nextTier);
    setRound(generateRound(nextTier));
    setCorrectQ(0);
    startedAt.current = Date.now();
    setScreen("round");
  };

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

  if (screen === "picker") {
    return (
      <MathTierPicker
        mistakeCount={mistakeCount}
        onSelect={startTier}
        onReview={startReview}
      />
    );
  }

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
            setScreen("picker");
          }}
        >
          返回难度选择
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
      onAgain={() => tier && startTier(tier)}
      onChangeMode={() => setScreen("picker")}
      changeModeLabel="换难度"
      onClose={onExit}
    />
  );
}
