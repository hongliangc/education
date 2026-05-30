"use client";

import { useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { generateChoices, generateMathRound, type MathProblem } from "@/content/math";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

export function MathGame({
  onComplete,
  onExit,
}: {
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [round, setRound] = useState<MathProblem[]>(() => generateMathRound(5));
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const p = round[qi];
  const choices = useMemo(() => generateChoices(p.answer), [p]);

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={round.length}
        onAgain={() => {
          setRound(generateMathRound(5));
          setQi(0);
          setCorrectQ(0);
          setDone(false);
          startedAt.current = Date.now();
        }}
        onClose={onExit}
      />
    );
  }

  const choose = (n: number) => {
    if (feedback) return;
    const ok = n === p.answer;
    setFeedback(ok ? "correct" : "wrong");
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
          score: correct * 10,
          totalQ: round.length,
          correctQ: correct,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
          starsEarned: stars,
        });
        setDone(true);
      } else {
        setQi((i) => i + 1);
      }
    }, 700);
  };

  return (
    <div>
      <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: `${(qi / round.length) * 100}%` }}
        />
      </div>

      <div
        className={`mt-5 rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-100 p-6 text-center anim-pop-in ${
          feedback === "correct" ? "anim-correct" : feedback === "wrong" ? "anim-shake" : ""
        }`}
      >
        <div className="text-5xl font-bold text-amber-700">{p.question} = ?</div>
        {p.visual && (
          <div className="mt-4 space-y-1 text-3xl">
            {p.visual.map((row, i) => (
              <div key={i}>{row}</div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {choices.map((c) => (
          <Btn
            key={c}
            size="lg"
            variant="primary"
            onClick={() => choose(c)}
            disabled={!!feedback}
            className="text-3xl py-6"
          >
            {c}
          </Btn>
        ))}
      </div>

      <p className="mt-3 text-center text-sm text-slate-400">
        第 {qi + 1} 题 / 共 {round.length} 题
      </p>
    </div>
  );
}
