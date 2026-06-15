"use client";

import { useEffect, useRef, useState } from "react";
import { useSFX } from "@/components/audio/useSFX";
import { GameDone } from "@/components/games/GameDone";
import { gradeAttempt } from "@/content/english/encourage";
import { matchSpokenWord } from "@/content/english/match";
import { ALPHABET } from "@/content/english/alphabet";
import { LetterCard } from "./LetterCard";

type Feedback = "correct" | "retry" | "soft" | null;

export function AlphabetLesson({
  startIndex,
  onExit,
}: {
  startIndex: number;
  onExit: () => void;
}) {
  const [offset, setOffset] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [good, setGood] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sfx } = useSFX();
  const entry = ALPHABET[(startIndex + offset) % ALPHABET.length];

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const advance = (earnedGood: boolean) => {
    const nextGood = good + (earnedGood ? 1 : 0);
    setGood(nextGood);
    timerRef.current = setTimeout(() => {
      setFeedback(null);
      setAttempts(0);
      if (offset + 1 >= ALPHABET.length) setDone(true);
      else setOffset((current) => current + 1);
    }, 850);
  };

  const onSpoken = (transcript: string | null) => {
    if (feedback === "correct" || feedback === "soft") return;
    if (transcript === null) {
      sfx.coin();
      setFeedback("soft");
      advance(false);
      return;
    }

    const ok = matchSpokenWord(transcript, [{ id: entry.letter, en: entry.word }]).matched;
    const attemptNumber = attempts + 1;
    const outcome = gradeAttempt(ok, attemptNumber);
    if (outcome === "correct") {
      sfx.correct();
      setFeedback("correct");
      advance(attemptNumber === 1);
    } else if (outcome === "retry") {
      sfx.wrong();
      setAttempts(attemptNumber);
      setFeedback("retry");
    } else {
      sfx.coin();
      setFeedback("soft");
      advance(false);
    }
  };

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOffset(0);
    setAttempts(0);
    setFeedback(null);
    setGood(0);
    setDone(false);
  };

  if (done) {
    return (
      <GameDone
        starsEarned={Math.max(1, Math.round((good / ALPHABET.length) * 3))}
        correctQ={good}
        totalQ={ALPHABET.length}
        gradeLabel="26 字母大冒险"
        onAgain={restart}
        onClose={onExit}
        onChangeMode={onExit}
        changeModeLabel="换个字母"
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200"
        >
          ← 字母表
        </button>
        <span className="text-sm font-black text-amber-500">
          {offset + 1} / {ALPHABET.length}
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
          style={{ width: `${((offset + 1) / ALPHABET.length) * 100}%` }}
        />
      </div>
      <LetterCard
        entry={entry}
        feedback={feedback}
        disabled={feedback === "correct" || feedback === "soft"}
        onSpoken={onSpoken}
      />
    </div>
  );
}
