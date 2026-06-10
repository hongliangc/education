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

const GRADE_RANK = new Map<Grade, number>(GRADES.map((grade, index) => [grade, index]));

// Cumulative vocabulary up to and including `grade` (design §4.3 — higher grades build on earlier).
export function getWordsForGrade(grade: Grade): GradedWord[] {
  const ceiling = GRADE_RANK.get(grade) ?? 0;
  return WORD_CATALOG.filter((word) => (GRADE_RANK.get(word.grade) ?? 0) <= ceiling);
}

// ---------------------------------------------------------------------------
// Legacy shape — kept until the matching game adopts the graded catalog (Task 7).
// ---------------------------------------------------------------------------
export interface WordPair {
  zh: string;
  en: string;
  emoji: string;
}

export const WORDS: WordPair[] = WORD_CATALOG.map(({ zh, en, emoji }) => ({ zh, en, emoji }));
