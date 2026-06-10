// Graded word catalog. The vocabulary itself lives in per-band leaf files under ./words so each
// is a self-contained data module (only the erased `GradedWord` type is shared). This aggregator
// composes them and exposes grade-aware accessors for the matching game. It carries runtime value
// imports, so it is loaded by the app/build — never by the Node test runner, which reads the leaf
// arrays directly.
import { GRADES, type Grade } from "@/lib/grades";
import { KINDERGARTEN_WORDS } from "./words/kindergarten";
import { GRADE_ONE_WORDS } from "./words/grade-one";
import { GRADE_TWO_WORDS } from "./words/grade-two";
import { GRADE_THREE_WORDS } from "./words/grade-three";
import {
  generateChallenges as buildChallenges,
  pickRound,
  wordsUpToGrade,
} from "./words/round";

export type { WordChallenge, WordChoice, WordRoundKind } from "./words/round";
export { usesMatchingGrid } from "./words/round";

export interface GradedWord {
  id: string;
  grade: Grade;
  en: string;
  zh: string;
  emoji: string;
  category: string;
  phonics?: string;
  example?: string;
}

export const WORD_CATALOG: readonly GradedWord[] = [
  ...KINDERGARTEN_WORDS,
  ...GRADE_ONE_WORDS,
  ...GRADE_TWO_WORDS,
  ...GRADE_THREE_WORDS,
];

// Cumulative vocabulary up to and including `grade` (design §4.3 — higher grades build on earlier).
export function getWordsForGrade(grade: Grade): GradedWord[] {
  return wordsUpToGrade(WORD_CATALOG, grade, GRADES);
}

// A matching-game round (kindergarten): up to `count` distinct words from the cumulative pool.
export function generateRound(grade: Grade, count = 4): GradedWord[] {
  return pickRound(getWordsForGrade(grade), count);
}

// A multiple-choice round (primary grades): grade-appropriate challenges over the cumulative pool.
export function generateChallenges(grade: Grade, count = 5) {
  return buildChallenges(getWordsForGrade(grade), grade, count);
}
