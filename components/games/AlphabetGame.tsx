"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { ALPHABET, type LetterItem } from "@/content/alphabet";
import { shuffle } from "@/lib/utils";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

export function AlphabetGame({ onComplete }: { onComplete: OnComplete }) {
  const [round, setRound] = useState(() => makeRound());
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const item = round[qi];
  const choices = useMemo(() => makeChoices(item), [item]);

  useEffect(() => {
    if (!item) return;
    speakText(item.word, { lang: "en-US", rate: 0.9 });
  }, [item]);

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={round.length}
        onAgain={() => {
          setRound(makeRound());
          setQi(0);
          setCorrectQ(0);
          setDone(false);
          startedAt.current = Date.now();
        }}
        onClose={() => {
          // GameModal close 由父级管理
        }}
      />
    );
  }

  const choose = (letter: string) => {
    if (feedback) return;
    const ok = letter === item.letter;
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
      <ProgressBar value={qi / round.length} />
      <div
        className={`mt-5 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 p-6 text-center anim-pop-in ${
          feedback === "correct" ? "anim-correct" : feedback === "wrong" ? "anim-shake" : ""
        }`}
      >
        <div className="text-8xl">{item.emoji}</div>
        <div className="mt-2 text-2xl font-bold text-slate-700">{item.word}</div>
        <button
          onClick={() => speakText(item.word, { lang: "en-US", rate: 0.85 })}
          className="mt-1 text-sm text-sky-600 underline"
        >
          🔊 再听一次
        </button>
      </div>

      <p className="mt-4 text-center text-slate-600">
        这个单词以哪个字母开头？
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {choices.map((c) => (
          <Btn
            key={c}
            size="lg"
            variant={c === item.letter && feedback === "correct" ? "secondary" : "primary"}
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

function makeRound(): LetterItem[] {
  return shuffle(ALPHABET).slice(0, 5);
}

function makeChoices(item: LetterItem): string[] {
  const all = ALPHABET.map((a) => a.letter).filter((l) => l !== item.letter);
  const wrong = shuffle(all).slice(0, 2);
  return shuffle([item.letter, ...wrong]);
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all"
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
}
