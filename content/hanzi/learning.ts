import type { Grade } from "@/lib/grades";
import type { HanziItem } from "./catalog";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { getHanziStatus, type HanziLearningStatus, type HanziProgressMap } from "./progress.ts";

export type HanziAgeBand = "early" | "primary";
export type HanziQueueReason = "practice" | "review" | "new";

export interface HanziLearningLimits {
  roundSize: number;
  maxNewPerRound: number;
}

export interface HanziQueueItem {
  item: HanziItem;
  reason: HanziQueueReason;
}

export interface HanziDashboard {
  ageBand: HanziAgeBand;
  limits: HanziLearningLimits;
  queue: HanziQueueItem[];
  mastered: HanziItem[];
  counts: Record<HanziLearningStatus, number>;
}

export function getHanziAgeBand(grade: Grade): HanziAgeBand {
  return grade === "K1" || grade === "K2" || grade === "K3" ? "early" : "primary";
}

export function getHanziLearningLimits(ageBand: HanziAgeBand): HanziLearningLimits {
  return ageBand === "early" ? { roundSize: 3, maxNewPerRound: 1 } : { roundSize: 6, maxNewPerRound: 3 };
}

export function buildHanziDashboard(
  items: readonly HanziItem[],
  progress: HanziProgressMap,
  grade: Grade,
  now = Date.now(),
): HanziDashboard {
  const ageBand = getHanziAgeBand(grade);
  const limits = getHanziLearningLimits(ageBand);
  const buckets: Record<HanziLearningStatus, HanziItem[]> = {
    practice: [],
    known: [],
    review: [],
  };

  for (const item of items) {
    buckets[getHanziStatus(progress[item.id], now)].push(item);
  }

  const practicedItems = buckets.practice.filter((item) => progress[item.id]);
  const newItems = buckets.practice.filter((item) => !progress[item.id]);
  const remainingSlots = Math.max(0, limits.roundSize - practicedItems.length - buckets.review.length);
  const cappedNewItems = newItems.slice(0, Math.min(limits.maxNewPerRound, remainingSlots));

  return {
    ageBand,
    limits,
    queue: [
      ...practicedItems.map((item) => ({ item, reason: "practice" as const })),
      ...buckets.review.map((item) => ({ item, reason: "review" as const })),
      ...cappedNewItems.map((item) => ({ item, reason: "new" as const })),
    ].slice(0, limits.roundSize),
    mastered: buckets.known,
    counts: {
      practice: buckets.practice.length,
      known: buckets.known.length,
      review: buckets.review.length,
    },
  };
}
