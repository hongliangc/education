import { HANZI_CATALOG, HANZI_LEVELS, type PrimaryGradeLevel } from "./catalog";
import {
  generateHanziChallenges as generateCoreChallenges,
  getHanziForLevel as getCoreHanziForLevel,
  getHanziForPrimaryGrade as getCoreHanziForPrimaryGrade,
  isPrimaryGradeLevel as isCorePrimaryGradeLevel,
  pickHanziWritingRound as pickCoreHanziWritingRound,
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
) {
  return generateCoreChallenges(HANZI_CATALOG, HANZI_LEVELS, level, count, rng);
}

export function pickHanziWritingRound(
  level: PrimaryGradeLevel,
  count = 4,
  rng: () => number = Math.random,
) {
  return pickCoreHanziWritingRound(HANZI_CATALOG, HANZI_LEVELS, level, count, rng);
}
