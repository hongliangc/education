import type { IdiomLesson } from "./idioms";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { getIdiomStatus, type IdiomProgressMap } from "./idiom-progress.ts";

export function selectNextIdiom(
  catalog: readonly IdiomLesson[],
  progress: IdiomProgressMap,
  previousId?: string,
  rng: () => number = Math.random,
  now = Date.now(),
): IdiomLesson | null {
  if (catalog.length === 0) return null;
  const ranked = catalog.map((lesson) => {
    const entry = progress[lesson.id];
    const status = getIdiomStatus(entry, now);
    const rank = entry && (entry.correctStreak ?? 0) < 3 ? 0 : status === "review" ? 1 : status === "new" ? 2 : 3;
    return { lesson, rank };
  });
  const activeRanks = ranked.filter(({ rank }) => rank < 3);
  const pool = activeRanks.length ? activeRanks : ranked;
  const bestRank = Math.min(...pool.map(({ rank }) => rank));
  let candidates = pool.filter(({ rank }) => rank === bestRank).map(({ lesson }) => lesson);
  if (candidates.length > 1 && previousId) candidates = candidates.filter(({ id }) => id !== previousId);
  return candidates[Math.floor(rng() * candidates.length)] ?? candidates[0] ?? null;
}
