"use client";

import { useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { matchSpokenWord } from "@/content/english/match";
import { gradeAttempt } from "@/content/english/encourage";
import type { EnglishScene } from "@/content/english/scene";
import { SpeakPanel } from "../SpeakPanel";

type Feedback = null | "correct" | "retry" | "soft";

// Step ③ 跟读识别 — the child says each word. Encourage-first (design §4): a clean try celebrates, a
// miss gets one gentle retry, a second miss soft-passes. Self-confirm (no mic) also passes. A
// first-try hit counts toward the stars. Reports good/total.
export function SpeakRepeatStage({
  scene,
  onDone,
}: {
  scene: EnglishScene;
  onDone: (score: { good: number; total: number }) => void;
}) {
  const [i, setI] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [good, setGood] = useState(0);
  const word = scene.words[i];
  const speakRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const advance = (earnedGood: boolean) => {
    const nextGood = good + (earnedGood ? 1 : 0);
    setGood(nextGood);
    setTimeout(() => {
      setFb(null);
      setAttempts(0);
      if (i + 1 >= scene.words.length) onDone({ good: nextGood, total: scene.words.length });
      else setI((n) => n + 1);
    }, 1000);
  };

  const onSpoken = (transcript: string | null) => {
    if (fb === "correct" || fb === "soft") return;
    if (transcript === null) {
      sfx.correct();
      setFb("soft");
      advance(false);
      return;
    }
    const ok = matchSpokenWord(transcript, [word]).matched;
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
      speakRef.current?.stop();
      speakRef.current = speakText(word.en, { lang: "en-US", rate: 0.8 });
    } else {
      sfx.coin();
      setFb("soft");
      advance(false);
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm font-bold text-emerald-500">③ 跟读识别 · Say it! 🎤</p>
      <div className="anim-pop-in mt-4 text-7xl">{word.emoji}</div>
      <div className="mt-1 text-3xl font-black text-slate-800">{word.en}</div>
      <div className="text-base text-slate-400">{word.phonics}</div>

      <div className="mt-4">
        <SpeakPanel say={word.en} onSpoken={onSpoken} disabled={fb === "correct" || fb === "soft"} />
      </div>

      <div className="mt-3 h-6 text-base font-bold">
        {fb === "correct" && <span className="text-emerald-500">太棒了！🎉</span>}
        {fb === "retry" && <span className="text-amber-500">再试一次，跟我读～ 🔁</span>}
        {fb === "soft" && <span className="text-sky-500">很好，我们继续！👍</span>}
      </div>

      <p className="mt-1 text-xs text-slate-400">
        第 {i + 1} / {scene.words.length}
      </p>
    </div>
  );
}
