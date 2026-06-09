import type { Grade } from "@/lib/grades";

export interface SessionResult {
  score: number;
  totalQ: number;
  correctQ: number;
  durationSec: number;
  starsEarned: number;
  // The grade the round was played at; omitted by pre-grade callers (recorded as LEGACY).
  gradeLevel?: Grade;
}

export type OnComplete = (r: SessionResult) => void;
