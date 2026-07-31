"use client";

import { useEffect } from "react";
import { usesMatchingGrid } from "@/content/words";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { WordMatchingRound } from "./words/WordMatchingRound";
import { WordContextRound } from "./words/WordContextRound";
import { showFairyGuide } from "@/lib/fairy-guide";

// Dispatch by grade: kindergarten taps picture/word matches; primary grades read or hear
// English prompts and choose (design §4.3). Remounting on grade change resets to fresh content.
export function WordsGame({
  grade,
  onComplete,
  onExit,
}: {
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  useEffect(() => {
    showFairyGuide({
      event: "enter",
      text: "先听清或读懂题目，再从四个选项里找出最合适的答案。",
      autoHideMs: 6000,
    });
  }, []);

  const props = { grade, onComplete, onExit };
  return usesMatchingGrid(grade) ? (
    <WordMatchingRound key={grade} {...props} />
  ) : (
    <WordContextRound key={grade} {...props} />
  );
}
