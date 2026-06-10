"use client";

import type { AlphabetQuestion } from "@/content/alphabet";

// Picture/word card for sound, CVC, vowel, digraph, blend and word-family work. Shows the focus
// letter (letter-sound) or an emoji plus the masked/whole word; the parent renders the choices.
export function PhonicsRound({
  question,
  feedback,
  onReplay,
}: {
  question: AlphabetQuestion;
  feedback: "correct" | "wrong" | null;
  onReplay: () => void;
}) {
  const showLetter = question.skill === "LETTER_SOUND" && question.letter;

  return (
    <div
      className={`mt-5 rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 p-6 text-center anim-pop-in ${
        feedback === "correct" ? "anim-correct" : feedback === "wrong" ? "anim-shake" : ""
      }`}
    >
      {showLetter ? (
        <div className="text-7xl font-black text-slate-700">
          {question.letter?.upper} {question.letter?.lower}
        </div>
      ) : (
        <div className="text-8xl">{question.emoji}</div>
      )}
      {(question.masked ?? question.word) && (
        <div className="mt-2 text-3xl font-bold tracking-widest text-slate-700">
          {question.masked ?? question.word}
        </div>
      )}
      <button
        onClick={onReplay}
        aria-label="再听一次"
        className="mt-1 text-sm text-violet-600 underline"
      >
        🔊 再听一次
      </button>
    </div>
  );
}
