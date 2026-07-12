export type IdiomLearningStatus = "new" | "learned" | "explained" | "used" | "review";
export type IdiomProgressOutcome = "learned" | "explained" | "used";

export interface IdiomProgressEntry {
  status: Exclude<IdiomLearningStatus, "new" | "review">;
  attempts: number;
  lastPracticedAt: number;
  nextReviewAt?: number;
  correctStreak?: number;
  explainCount?: number;
  reviewLevel?: number;
}

export function recordIdiomExplanation(progress: IdiomProgressMap, idiomId: string, now = Date.now()): IdiomProgressMap {
  const previous = progress[idiomId];
  return { ...progress, [idiomId]: { status: "explained", attempts: previous?.attempts ?? 0, correctStreak: previous?.correctStreak ?? 0, explainCount: (previous?.explainCount ?? 0) + 1, reviewLevel: previous?.reviewLevel ?? 0, lastPracticedAt: now } };
}

export function recordIdiomAnswer(progress: IdiomProgressMap, idiomId: string, correct: boolean, now = Date.now()): IdiomProgressMap {
  const previous = progress[idiomId];
  const correctStreak = correct ? (previous?.correctStreak ?? 0) + 1 : 0;
  const reviewLevel = correct ? Math.min(5, (previous?.reviewLevel ?? 0) + 1) : 0;
  const delays = [0, 1, 3, 7, 14, 30];
  return { ...progress, [idiomId]: { status: correctStreak >= 3 ? "used" : "learned", attempts: (previous?.attempts ?? 0) + 1, correctStreak, explainCount: previous?.explainCount ?? 0, reviewLevel, lastPracticedAt: now, ...(correct ? { nextReviewAt: now + delays[reviewLevel]! * DAY_MS } : {}) } };
}

export type IdiomProgressMap = Record<string, IdiomProgressEntry>;

const DAY_MS = 24 * 60 * 60 * 1000;

export function getIdiomStatus(
  entry: IdiomProgressEntry | undefined,
  now = Date.now(),
): IdiomLearningStatus {
  if (!entry) return "new";
  if (entry.nextReviewAt && entry.nextReviewAt <= now) return "review";
  return entry.status;
}

export function recordIdiomResult(
  progress: IdiomProgressMap,
  idiomId: string,
  outcome: IdiomProgressOutcome,
  now = Date.now(),
): IdiomProgressMap {
  return {
    ...progress,
    [idiomId]: {
      status: outcome,
      attempts: (progress[idiomId]?.attempts ?? 0) + 1,
      lastPracticedAt: now,
      ...(outcome === "used" ? { nextReviewAt: now + 7 * DAY_MS } : {}),
    },
  };
}
