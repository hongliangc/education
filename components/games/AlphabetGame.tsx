"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { generateRound, isLetterDisplaySkill, type AlphabetQuestion } from "@/content/alphabet";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";
import { AlphabetRound } from "./alphabet/AlphabetRound";
import { PhonicsRound } from "./alphabet/PhonicsRound";

export function AlphabetGame({
  grade,
  onComplete,
  onExit,
}: {
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [round, setRound] = useState<AlphabetQuestion[]>(() => generateRound(grade));
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const gradeRef = useRef(grade);

  const question = round[qi];

  const replay = useCallback(() => {
    if (question) speakText(question.speak.text, { lang: question.speak.lang, rate: 0.85 });
  }, [question]);

  // Read each new question aloud (letter name or word) as it appears.
  useEffect(() => {
    if (question) speakText(question.speak.text, { lang: question.speak.lang, rate: 0.9 });
  }, [question]);

  const restart = useCallback(() => {
    setRound(generateRound(grade));
    setQi(0);
    setCorrectQ(0);
    setFeedback(null);
    setDone(false);
    startedAt.current = Date.now();
  }, [grade]);

  // Restart with fresh content whenever the parent switches the practice grade.
  useEffect(() => {
    if (gradeRef.current !== grade) {
      gradeRef.current = grade;
      restart();
    }
  }, [grade, restart]);

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={round.length}
        gradeLabel={GRADE_LABELS[grade]}
        onAgain={restart}
        onClose={onExit}
      />
    );
  }

  if (!question) return null;

  const choose = (choice: string) => {
    if (feedback) return;
    const ok = choice === question.answer;
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

      {isLetterDisplaySkill(question.skill) ? (
        <AlphabetRound question={question} feedback={feedback} onReplay={replay} />
      ) : (
        <PhonicsRound question={question} feedback={feedback} onReplay={replay} />
      )}

      <p className="mt-4 text-center text-slate-600">{question.prompt}</p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {question.choices.map((choice) => (
          <Btn
            key={choice}
            size="lg"
            variant={choice === question.answer && feedback === "correct" ? "secondary" : "primary"}
            onClick={() => choose(choice)}
            disabled={!!feedback}
            className="py-5 text-2xl"
          >
            {choice}
          </Btn>
        ))}
      </div>

      <p className="mt-3 text-center text-sm text-slate-400">
        第 {qi + 1} 题 / 共 {round.length} 题
      </p>
    </div>
  );
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
