"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import {
  generateHanziChallenges,
  type HanziChallenge,
  type PrimaryGradeLevel,
} from "@/content/hanzi";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { HanziLevelTabs } from "./HanziLevelTabs";

const ROUND_SIZE = 8;

export function HanziRecognitionRound({
  level,
  onLevelChange,
  onComplete,
  onExit,
  onChangeMode,
}: {
  level: PrimaryGradeLevel;
  onLevelChange: (level: PrimaryGradeLevel) => void;
  onComplete: OnComplete;
  onExit: () => void;
  onChangeMode: () => void;
}) {
  const [round, setRound] = useState<HanziChallenge[]>(() =>
    generateHanziChallenges(level, ROUND_SIZE),
  );
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const question = round[qi];

  const restart = useCallback(
    (nextLevel = level) => {
      setRound(generateHanziChallenges(nextLevel, ROUND_SIZE));
      setQi(0);
      setCorrectQ(0);
      setFeedback(null);
      setDone(false);
      startedAt.current = Date.now();
    },
    [level],
  );

  useEffect(() => {
    restart(level);
  }, [level, restart]);

  const replay = useCallback(() => {
    if (question) speakText(question.speak.text, { lang: question.speak.lang, rate: 0.9 });
  }, [question]);

  useEffect(() => {
    replay();
  }, [replay]);

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={round.length}
        onAgain={() => restart()}
        onClose={onExit}
        onChangeMode={onChangeMode}
        changeModeLabel="去练写字"
      />
    );
  }

  if (!question) return null;

  const choose = (choiceId: string) => {
    if (feedback) return;
    const ok = choiceId === question.answerId;
    setFeedback(ok ? "correct" : "wrong");
    if (ok) {
      sfx.correct();
      setCorrectQ((value) => value + 1);
    } else {
      sfx.wrong();
    }
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= round.length) {
        const correct = ok ? correctQ + 1 : correctQ;
        const stars = Math.max(1, Math.round((correct / round.length) * 3));
        onComplete({
          score: correct * 12,
          totalQ: round.length,
          correctQ: correct,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
          starsEarned: stars,
        });
        setDone(true);
      } else {
        setQi((value) => value + 1);
      }
    }, 650);
  };

  return (
    <div className="space-y-5">
      <HanziLevelTabs level={level} onChange={onLevelChange} />

      <div className="rounded-3xl bg-pink-50 p-5 text-center ring-1 ring-pink-100">
        <div className="text-sm font-bold text-pink-500">第 {qi + 1} 题 / 共 {round.length} 题</div>
        <div className="mt-2 text-2xl font-bold text-slate-800">{question.prompt}</div>
        <button
          type="button"
          onClick={replay}
          aria-label="再听一次"
          className="mt-3 rounded-full bg-white px-4 py-2 text-xl shadow ring-1 ring-pink-100"
        >
          🔊
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.choices.map((choice) => {
          const answer = choice.id === question.answerId;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={!!feedback}
              className={`rounded-3xl bg-white p-4 text-left shadow ring-2 transition ${
                feedback && answer
                  ? "ring-emerald-300 bg-emerald-50 anim-correct"
                  : "ring-slate-100 hover:bg-sky-50"
              }`}
            >
              <span className="block text-center text-5xl font-bold text-slate-800">{choice.char}</span>
              <span className="mt-2 block text-center text-sm font-bold text-sky-500">
                {choice.pinyin}
              </span>
              <span className="mt-1 block text-center text-xs text-slate-500">{choice.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Btn variant="ghost" onClick={onChangeMode}>
          ✏️ 去练写字
        </Btn>
      </div>
    </div>
  );
}
