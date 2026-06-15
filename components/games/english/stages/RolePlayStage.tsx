"use client";

import { useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { FairySprite } from "@/components/fairy/FairySprite";
import { useSFX } from "@/components/audio/useSFX";
import { matchSpokenWord } from "@/content/english/match";
import { gradeAttempt } from "@/content/english/encourage";
import type { EnglishScene } from "@/content/english/scene";
import { SpeakPanel } from "../SpeakPanel";

type Feedback = null | "correct" | "retry" | "soft";

// Step ⑤ 角色扮演 — the fairy plays the shopkeeper. Fairy lines speak and auto-advance; on a child
// turn the suggested line is shown and the child speaks it. Semi-open: any acceptable answer counts
// (closed set = turn.accept), judged encourage-first. Reports good/total across the child's turns.
export function RolePlayStage({
  scene,
  onDone,
}: {
  scene: EnglishScene;
  onDone: (score: { good: number; total: number }) => void;
}) {
  const turns = scene.dialogue;
  const childTotal = turns.filter((t) => t.speaker === "child").length;
  const [step, setStep] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [good, setGood] = useState(0);
  const speakRef = useRef<SpeechController | null>(null);
  const doneRef = useRef(false);
  const { sfx } = useSFX();
  const turn = turns[step];

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  // Drive the script: speak fairy lines then auto-advance; pause on child turns for the mic.
  useEffect(() => {
    if (!turn) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone({ good, total: childTotal });
      }
      return;
    }
    if (turn.speaker === "fairy") {
      setFb(null);
      speakRef.current?.stop();
      speakRef.current = speakText(turn.text, {
        lang: "en-US",
        rate: 0.85,
        onEnd: () => setStep((s) => s + 1),
      });
    } else {
      setAttempts(0);
      setFb(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const advance = (earnedGood: boolean) => {
    const nextGood = good + (earnedGood ? 1 : 0);
    setGood(nextGood);
    setTimeout(() => {
      setFb(null);
      setStep((s) => s + 1);
    }, 900);
  };

  const onSpoken = (transcript: string | null) => {
    if (!turn || turn.speaker !== "child" || fb === "correct" || fb === "soft") return;
    if (transcript === null) {
      sfx.correct();
      setFb("soft");
      advance(false);
      return;
    }
    const candidates = (turn.accept ?? []).map((a) => ({ id: a, en: a }));
    const ok = matchSpokenWord(transcript, candidates).matched;
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

  if (!turn) return null;

  const isFairy = turn.speaker === "fairy";

  return (
    <div>
      <p className="text-center text-sm font-bold text-purple-500">⑤ 角色扮演 · At the shop 🧚</p>

      <div className="mt-3 flex justify-center">
        <FairySprite mood={isFairy ? "excited" : "happy"} size={96} />
      </div>

      <div className="anim-pop-in mt-3 min-h-[68px] rounded-2xl bg-purple-50 px-4 py-3 text-center ring-1 ring-purple-100">
        {isFairy ? (
          <>
            <p className="text-lg font-bold text-slate-700">🧚 {turn.text}</p>
            {turn.zh ? <p className="mt-1 text-xs text-slate-400">{turn.zh}</p> : null}
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400">轮到你啦，试着说：</p>
            <p className="text-lg font-bold text-purple-600">🧒 {turn.text}</p>
            {turn.zh ? <p className="text-xs text-slate-400">{turn.zh}</p> : null}
          </>
        )}
      </div>

      {!isFairy ? (
        <div className="mt-4 flex flex-col items-center gap-2">
          <SpeakPanel
            say={turn.text}
            onSpoken={onSpoken}
            disabled={fb === "correct" || fb === "soft"}
          />
          <div className="h-6 text-base font-bold">
            {fb === "correct" && <span className="text-emerald-500">说得真好！🎉</span>}
            {fb === "retry" && <span className="text-amber-500">没关系，再说一次～</span>}
            {fb === "soft" && <span className="text-sky-500">很好，继续！👍</span>}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-slate-400">精灵正在说话… 🔊</p>
      )}
    </div>
  );
}
