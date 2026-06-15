"use client";

import { useEffect, useRef, useState } from "react";
import { useSFX } from "@/components/audio/useSFX";
import { GameDone } from "@/components/games/GameDone";
import { gradeAttempt } from "@/content/english/encourage";
import { matchSpokenWord } from "@/content/english/match";
import {
  exampleWords,
  groupInfo,
  phonemesInGroup,
  type PhonemeGroup,
} from "@/content/english/ipa";
import { GroupChant } from "./GroupChant";
import { GroupStory } from "./GroupStory";
import { PhonemeCard } from "./PhonemeCard";

type Feedback = "correct" | "retry" | "soft" | null;

export function IpaLesson({ group, onExit }: { group: PhonemeGroup; onExit: () => void }) {
  const phonemes = phonemesInGroup(group);
  const [index, setIndex] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [good, setGood] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { sfx } = useSFX();
  const current = phonemes[index];
  const info = groupInfo(group);
  const groupWords = phonemes.map((phoneme) => phoneme.examples[0].word);

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
      if (index + 1 >= phonemes.length) setDone(true);
      else setIndex((currentIndex) => currentIndex + 1);
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

    const candidates = exampleWords(current).map((word) => ({ id: word, en: word }));
    const ok = matchSpokenWord(transcript, candidates).matched;
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
    setIndex(0);
    setAttempts(0);
    setFeedback(null);
    setGood(0);
    setDone(false);
  };

  if (done) {
    return (
      <div>
        <GroupStory info={info} words={groupWords} />
        <GameDone
          starsEarned={Math.max(1, Math.round((good / phonemes.length) * 3))}
          correctQ={good}
          totalQ={phonemes.length}
          gradeLabel={`国际音标 · ${group}`}
          onAgain={restart}
          onClose={onExit}
          onChangeMode={onExit}
          changeModeLabel="换个分组"
        />
      </div>
    );
  }

  const vowel = current.kind === "vowel";
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-500 ring-1 ring-slate-200"
        >
          ← 音标分组
        </button>
        <span className={`text-sm font-black ${vowel ? "text-rose-500" : "text-sky-500"}`}>
          {group} · {index + 1} / {phonemes.length}
        </span>
      </div>
      <div className={`mt-3 h-2 overflow-hidden rounded-full ${vowel ? "bg-rose-100" : "bg-sky-100"}`}>
        <div
          className={`h-full rounded-full transition-all ${vowel ? "bg-rose-400" : "bg-sky-400"}`}
          style={{ width: `${((index + 1) / phonemes.length) * 100}%` }}
        />
      </div>
      <GroupChant info={info} words={groupWords} />
      <PhonemeCard
        key={current.id}
        phoneme={current}
        feedback={feedback}
        disabled={feedback === "correct" || feedback === "soft"}
        onSpoken={onSpoken}
      />
    </div>
  );
}
