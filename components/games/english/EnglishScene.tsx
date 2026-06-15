"use client";

import { useState } from "react";
import { GameDone } from "@/components/games/GameDone";
import { GRADE_LABELS } from "@/lib/grades";
import type { EnglishScene as Scene } from "@/content/english/scene";
import { WordCardStage } from "./stages/WordCardStage";
import { ListenFindStage } from "./stages/ListenFindStage";
import { SpeakRepeatStage } from "./stages/SpeakRepeatStage";
import { PatternStage } from "./stages/PatternStage";
import { RolePlayStage } from "./stages/RolePlayStage";

type Score = { good: number; total: number };
const STEPS = ["看图", "听音", "跟读", "句型", "对话"] as const;

// Pure playback orchestrator for one English scene (design §5): walks the five stages, accumulates
// the speaking/listening score, and ends on the shared celebration screen. Each stage owns its own
// speech lifecycle and clears it on unmount, so this component only sequences and tallies.
export function EnglishScene({ scene, onExit }: { scene: Scene; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState<Score>({ good: 0, total: 0 });
  const [done, setDone] = useState(false);

  const next = (s?: Score) => {
    if (s) setScore((prev) => ({ good: prev.good + s.good, total: prev.total + s.total }));
    if (step + 1 >= STEPS.length) setDone(true);
    else setStep((n) => n + 1);
  };

  const restart = () => {
    setStep(0);
    setScore({ good: 0, total: 0 });
    setDone(false);
  };

  if (done) {
    const ratio = score.total ? score.good / score.total : 1;
    const stars = Math.max(1, Math.round(ratio * 3));
    return (
      <div>
        <SceneHeader scene={scene} step={STEPS.length} />
        <GameDone
          starsEarned={stars}
          correctQ={score.good}
          totalQ={score.total}
          gradeLabel={`${GRADE_LABELS[scene.grade]} · ${scene.level}`}
          onAgain={restart}
          onClose={onExit}
        />
      </div>
    );
  }

  return (
    <div>
      <SceneHeader scene={scene} step={step} />
      <div className="mt-4">
        {step === 0 && <WordCardStage scene={scene} onDone={() => next()} />}
        {step === 1 && <ListenFindStage scene={scene} onDone={next} />}
        {step === 2 && <SpeakRepeatStage scene={scene} onDone={next} />}
        {step === 3 && <PatternStage scene={scene} onDone={next} />}
        {step === 4 && <RolePlayStage scene={scene} onDone={next} />}
      </div>
    </div>
  );
}

function SceneHeader({ scene, step }: { scene: Scene; step: number }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800">🛒 {scene.title}</h2>
        <span className="text-xs font-bold text-slate-400">
          {scene.zhTitle} · {scene.level}
        </span>
      </div>
      <div className="mt-2 flex gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1 text-center">
            <div className={`h-1.5 rounded-full ${i <= step ? "bg-emerald-400" : "bg-slate-200"}`} />
            <span
              className={`mt-1 block text-[10px] ${
                i === step ? "font-bold text-emerald-600" : "text-slate-400"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
