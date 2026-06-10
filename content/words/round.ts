// Pure round-selection helpers for the word matching game. This is a self-contained leaf: it
// carries only erased type imports (no runtime value imports), so the Node test runner can load
// it directly via its `.ts` path, while the catalog data is passed in as arguments.
import type { GradedWord } from "../words";
import type { Grade } from "@/lib/grades";

// Cumulative vocabulary up to and including `grade` (design §4.3 — higher grades build on lower
// ones). `order` is the difficulty ranking (easiest first); a word ranked at or below the target
// grade is in scope.
export function wordsUpToGrade(
  catalog: readonly GradedWord[],
  grade: Grade,
  order: readonly Grade[],
): GradedWord[] {
  const ceiling = order.indexOf(grade);
  return catalog.filter((word) => order.indexOf(word.grade) <= ceiling);
}

// Draw up to `count` distinct words from `pool` in random order. `rng` is injectable so tests can
// pin the shuffle; pools smaller than `count` return in full rather than padding or repeating.
export function pickRound(
  pool: readonly GradedWord[],
  count: number,
  rng: () => number = Math.random,
): GradedWord[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
