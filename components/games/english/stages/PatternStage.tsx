"use client";

import { useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { matchSpokenWord } from "@/content/english/match";
import { gradeAttempt } from "@/content/english/encourage";
import type { EnglishScene, EnglishWord } from "@/content/english/scene";
import { SpeakPanel } from "../SpeakPanel";

type Feedback = null | "correct" | "retry" | "soft";
const TARGET = 2; // complete two substitutions of the frame

// Step ④ 句型替换 — the frame "I like ___ ." The child taps a fruit to fill the blank, then says the
// whole sentence. Semi-open: any fruit is fine (it's about the pattern), judged encourage-first.
// Reports good/total across TARGET sentences.
export function PatternStage({
  scene,
  onDone,
}: {
  scene: EnglishScene;
  onDone: (score: { good: number; total: number }) => void;
}) {
  const [filledId, setFilledId] = useState<string | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [good, setGood] = useState(0);
  const speakRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  const filled: EnglishWord | null = scene.words.find((w) => w.id === filledId) ?? null;
  const sentence = filled ? `I like ${filled.en}.` : scene.pattern;

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const pickChip = (id: string) => {
    if (fb === "correct" || fb === "soft") return;
    setFilledId(id);
    setAttempts(0);
    setFb(null);
    const w = scene.words.find((x) => x.id === id);
    if (w) {
      speakRef.current?.stop();
      speakRef.current = speakText(`I like ${w.en}.`, { lang: "en-US", rate: 0.85 });
    }
  };

  const advance = (earnedGood: boolean) => {
    const nextGood = good + (earnedGood ? 1 : 0);
    const nextDone = doneCount + 1;
    setGood(nextGood);
    setTimeout(() => {
      setFb(null);
      setAttempts(0);
      setFilledId(null);
      setDoneCount(nextDone);
      if (nextDone >= TARGET) onDone({ good: nextGood, total: TARGET });
    }, 1000);
  };

  const onSpoken = (transcript: string | null) => {
    if (!filled || fb === "correct" || fb === "soft") return;
    if (transcript === null) {
      sfx.correct();
      setFb("soft");
      advance(false);
      return;
    }
    const ok = matchSpokenWord(transcript, [filled]).matched;
    const attemptNo = attempts + 1;
    const outcome = gradeAttempt(ok, attemptNo);
    if (outcome === "correct") {
      sfx.correct();
      setFb("correct");
      advance(attemptNo === 1);
    } else if (outcome === "retry") {
      sfx.wrong();
      setAttempts(attemptNo);
      setFb("retry");
    } else {
      sfx.coin();
      setFb("soft");
      advance(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm font-bold text-emerald-500">④ 句型替换 · Say the pattern</p>

      <div className="mt-4 text-2xl font-black text-slate-800">
        I like{" "}
        <span
          className={`inline-block min-w-[3.5rem] border-b-4 px-1 ${
            filled ? "border-emerald-400 text-emerald-600" : "border-amber-300 text-slate-300"
          }`}
        >
          {filled ? filled.en : "＿＿"}
        </span>{" "}
        .
      </div>
      {filled ? <div className="mt-1 text-4xl">{filled.emoji}</div> : null}

      <div className="mt-4 grid grid-cols-4 gap-2">
        {scene.words.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => pickChip(w.id)}
            disabled={fb === "correct" || fb === "soft"}
            className={`rounded-2xl py-4 text-4xl shadow ring-2 transition active:scale-95 disabled:opacity-50 ${
              filledId === w.id ? "bg-emerald-100 ring-emerald-300" : "bg-white ring-emerald-100 hover:bg-emerald-50"
            }`}
            aria-label={w.en}
          >
            {w.emoji}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[5rem]">
        {filled ? (
          <SpeakPanel
            say={sentence}
            onSpoken={onSpoken}
            disabled={fb === "correct" || fb === "soft"}
          />
        ) : (
          <p className="text-sm text-slate-400">先选一种水果填进句子里 👆</p>
        )}
      </div>

      <div className="h-6 text-base font-bold">
        {fb === "correct" && <span className="text-emerald-500">说得真棒！🎉</span>}
        {fb === "retry" && <span className="text-amber-500">再说一次整句～ 🔁</span>}
        {fb === "soft" && <span className="text-sky-500">很好，继续！👍</span>}
      </div>

      <p className="mt-1 text-xs text-slate-400">
        第 {Math.min(doneCount + 1, TARGET)} / {TARGET} 句
      </p>
    </div>
  );
}
