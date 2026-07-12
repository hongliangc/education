import { HANZI_CATALOG, HANZI_LEVELS, type HanziItem, type PrimaryGradeLevel } from "./catalog";
import type { HanziProgressMap } from "./progress";
import {
  generateHanziChallenges as generateCoreChallenges,
  generateHanziChallengesFromPool as generateCoreChallengesFromPool,
  getHanziForLevel as getCoreHanziForLevel,
  getHanziForPrimaryGrade as getCoreHanziForPrimaryGrade,
  isPrimaryGradeLevel as isCorePrimaryGradeLevel,
  pickHanziWritingRound as pickCoreHanziWritingRound,
  pickHanziWritingRoundFromPool as pickCoreHanziWritingRoundFromPool,
} from "./round-core";

export type {
  HanziChallenge,
  HanziChoice,
  HanziRecognitionMode,
} from "./round-core";

export function isPrimaryGradeLevel(value: unknown): value is PrimaryGradeLevel {
  return isCorePrimaryGradeLevel(value, HANZI_LEVELS);
}

export function getHanziForLevel(level: PrimaryGradeLevel) {
  return getCoreHanziForLevel(HANZI_CATALOG, level);
}

export function getHanziForPrimaryGrade(level: PrimaryGradeLevel) {
  return getCoreHanziForPrimaryGrade(HANZI_CATALOG, HANZI_LEVELS, level);
}

export function getDefaultHanziLevel(grade: string): PrimaryGradeLevel {
  if (isPrimaryGradeLevel(grade)) return grade;
  if (grade === "K1" || grade === "K2" || grade === "K3") return "G1";
  return "G3";
}

export function generateHanziChallenges(
  level: PrimaryGradeLevel,
  count = 8,
  rng: () => number = Math.random,
  progress?: HanziProgressMap,
  now = Date.now(),
) {
  return generateCoreChallenges(HANZI_CATALOG, HANZI_LEVELS, level, count, rng, progress, now);
}

export function generateHanziChallengesFromPool(
  answerPool: readonly HanziItem[],
  distractorPool: readonly HanziItem[],
  count = 8,
  rng: () => number = Math.random,
) {
  return generateCoreChallengesFromPool(answerPool, distractorPool, count, rng);
}

export function pickHanziWritingRound(
  level: PrimaryGradeLevel,
  count = 4,
  rng: () => number = Math.random,
  progress?: HanziProgressMap,
  now = Date.now(),
) {
  return pickCoreHanziWritingRound(HANZI_CATALOG, HANZI_LEVELS, level, count, rng, progress, now);
}

export function pickHanziWritingRoundFromPool(
  items: readonly HanziItem[],
  count = 4,
  rng: () => number = Math.random,
) {
  return pickCoreHanziWritingRoundFromPool(items, count, rng);
}
