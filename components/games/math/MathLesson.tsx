"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { speakTextStream, type SpeechController } from "@/lib/speech";
import type { MathProblem } from "@/content/math";
import type { MathLesson as Lesson } from "@/content/math/curriculum";
import { sceneForProblem } from "@/content/math/scene";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { MathRound } from "./MathRound";
import { MathGuide } from "./MathGuide";

const ROUND_SIZE = 5;

type Phase = "intro" | "demo" | "practice" | "done";

function generateExample(lesson: Lesson): MathProblem {
  const candidates = lesson.generate(ROUND_SIZE);
  return candidates.find((problem) => sceneForProblem(problem) !== null) ?? candidates[0]!;
}

// One guided lesson: 引入概念 → 示范 → 练习 → 巩固. Reuses the module's round/visual/guide so the
// teaching matches the rest of the math experience.
export function MathLesson({
  lesson,
  childId,
  onComplete,
  onExit,
  onMistakesChanged,
}: {
  lesson: Lesson;
  childId: string;
  onComplete: OnComplete;
  onExit: () => void;
  onMistakesChanged: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [problems, setProblems] = useState<MathProblem[]>(() => lesson.generate(ROUND_SIZE));
  const [example, setExample] = useState<MathProblem>(() => generateExample(lesson));
  const [correctQ, setCorrectQ] = useState(0);
  const startedAt = useRef(Date.now());
  // The intro "再听一遍" voice; stop it when leaving the intro so it never bleeds into the
  // demo (where MathGuide starts its own narration) or gets cut mid-sentence on transition.
  const conceptSpeech = useRef<SpeechController | null>(null);
  const stopConcept = () => {
    conceptSpeech.current?.stop();
    conceptSpeech.current = null;
  };
  useEffect(() => stopConcept, []);

  const restart = () => {
    setProblems(lesson.generate(ROUND_SIZE));
    setExample(generateExample(lesson));
    setCorrectQ(0);
    startedAt.current = Date.now();
    setPhase("intro");
  };

  if (phase === "intro") {
    return (
      <div className="py-4 text-center anim-pop-in">
        <div className="text-6xl">{lesson.icon}</div>
        <h3 className="mt-2 text-2xl font-bold text-slate-700">{lesson.title}</h3>
        <p className="mx-auto mt-3 max-w-sm rounded-2xl bg-sky-50 px-4 py-3 text-base font-bold text-slate-600 ring-1 ring-sky-100">
          {lesson.concept}
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Btn
            variant="ghost"
            onClick={() => {
              stopConcept();
              conceptSpeech.current = speakTextStream(lesson.concept, { lang: "zh-CN" });
            }}
          >
            🔊 再听一遍
          </Btn>
          <Btn
            variant="primary"
            onClick={() => {
              stopConcept();
              setPhase("demo");
            }}
          >
            看老师做一遍 ▶
          </Btn>
        </div>
      </div>
    );
  }

  if (phase === "demo") {
    return (
      <div>
        <p className="text-center text-sm font-bold text-slate-500">老师先做个示范 👀</p>
        <div className="mt-3 rounded-3xl bg-gradient-to-br from-amber-50 to-yellow-100 p-5 text-center">
          <div className="text-3xl font-bold text-amber-700 sm:text-4xl">
            {example.prompt}
            {example.kind === "arithmetic" ? " = ?" : ""}
          </div>
        </div>
        <MathGuide problem={example} onComplete={() => setPhase("practice")} />
      </div>
    );
  }

  if (phase === "practice") {
    return (
      <MathRound
        childId={childId}
        problems={problems}
        review={false}
        onMistakesChanged={onMistakesChanged}
        onFinish={(correct) => {
          setCorrectQ(correct);
          const stars = Math.max(1, Math.round((correct / problems.length) * 3));
          onComplete({
            score: correct * 10,
            totalQ: problems.length,
            correctQ: correct,
            durationSec: Math.round((Date.now() - startedAt.current) / 1000),
            starsEarned: stars,
          });
          setPhase("done");
        }}
      />
    );
  }

  const stars = Math.max(1, Math.round((correctQ / problems.length) * 3));
  return (
    <GameDone
      starsEarned={stars}
      correctQ={correctQ}
      totalQ={problems.length}
      onAgain={restart}
      onClose={onExit}
    />
  );
}
