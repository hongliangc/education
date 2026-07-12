export type HanziLearningStatus = "practice" | "known" | "review";

export interface HanziProgressEntry {
  attempts: number;
  correctStreak: number;
  lastPracticedAt: number;
  nextReviewAt?: number;
  explainCount?: number;
  stage?: "learning" | "explaining" | "mastered";
}

export type HanziProgressMap = Record<string, HanziProgressEntry>;

export interface HanziRef {
  id: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function getHanziStatus(
  entry: HanziProgressEntry | undefined,
  now = Date.now(),
): HanziLearningStatus {
  if (!entry || entry.correctStreak < 3) return "practice";
  if (typeof entry.nextReviewAt === "number" && entry.nextReviewAt <= now) return "review";
  return "known";
}

export function recordHanziResult(
  progress: HanziProgressMap,
  hanziId: string,
  correct: boolean,
  now = Date.now(),
): HanziProgressMap {
  const previous = progress[hanziId];
  const correctStreak = correct ? (previous?.correctStreak ?? 0) + 1 : 0;
  const nextReviewAt = correctStreak >= 3 ? now + reviewDelayMs(correctStreak) : undefined;
  return {
    ...progress,
    [hanziId]: {
      attempts: (previous?.attempts ?? 0) + 1,
      correctStreak,
      lastPracticedAt: now,
      explainCount: previous?.explainCount ?? 0,
      stage: correctStreak >= 3 ? "mastered" : previous?.stage ?? "learning",
      ...(nextReviewAt ? { nextReviewAt } : {}),
    },
  };
}

export function recordHanziExplanation(
  progress: HanziProgressMap,
  hanziId: string,
  now = Date.now(),
): HanziProgressMap {
  const previous = progress[hanziId];
  return {
    ...progress,
    [hanziId]: {
      attempts: previous?.attempts ?? 0,
      correctStreak: previous?.correctStreak ?? 0,
      lastPracticedAt: now,
      explainCount: (previous?.explainCount ?? 0) + 1,
      stage: "explaining",
      ...(previous?.nextReviewAt ? { nextReviewAt: previous.nextReviewAt } : {}),
    },
  };
}

export function categorizeHanzi<T extends HanziRef>(
  items: readonly T[],
  progress: HanziProgressMap,
  now = Date.now(),
): Record<HanziLearningStatus, T[]> {
  const groups: Record<HanziLearningStatus, T[]> = {
    practice: [],
    known: [],
    review: [],
  };
  for (const item of items) {
    groups[getHanziStatus(progress[item.id], now)].push(item);
  }
  return groups;
}

export function selectDueHanzi<T extends HanziRef>(
  items: readonly T[],
  progress: HanziProgressMap,
  now = Date.now(),
): T[] {
  return items.filter((item) => getHanziStatus(progress[item.id], now) !== "known");
}

function reviewDelayMs(correctStreak: number): number {
  if (correctStreak >= 7) return 30 * DAY_MS;
  if (correctStreak === 6) return 14 * DAY_MS;
  if (correctStreak === 5) return 7 * DAY_MS;
  if (correctStreak === 4) return 3 * DAY_MS;
  return DAY_MS;
}
