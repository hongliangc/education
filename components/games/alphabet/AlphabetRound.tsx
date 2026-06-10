"use client";

import type { AlphabetQuestion } from "@/content/alphabet";

// Letter-tile card for shape recognition and case matching. The target glyph is shown big and the
// child picks the matching letter from the choices rendered by the parent.
export function AlphabetRound({
  question,
  feedback,
  onReplay,
}: {
  question: AlphabetQuestion;
  feedback: "correct" | "wrong" | null;
  onReplay: () => void;
}) {
  const glyph = question.skill === "CASE_MATCH" ? question.letter?.lower : question.letter?.upper;

  return (
    <div
      className={`mt-5 rounded-3xl bg-gradient-to-br from-sky-100 to-blue-100 p-6 text-center anim-pop-in ${
        feedback === "correct" ? "anim-correct" : feedback === "wrong" ? "anim-shake" : ""
      }`}
    >
      <div className="text-8xl font-black text-slate-700">{glyph}</div>
      <button
        onClick={onReplay}
        aria-label="再听一次字母读音"
        className="mt-1 text-sm text-sky-600 underline"
      >
        🔊 再听一次
      </button>
    </div>
  );
}
