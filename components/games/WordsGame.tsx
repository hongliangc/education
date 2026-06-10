"use client";

import { usesMatchingGrid } from "@/content/words";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { WordMatchingRound } from "./words/WordMatchingRound";
import { WordContextRound } from "./words/WordContextRound";

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
  const props = { grade, onComplete, onExit };
  return usesMatchingGrid(grade) ? (
    <WordMatchingRound key={grade} {...props} />
  ) : (
    <WordContextRound key={grade} {...props} />
  );
}
