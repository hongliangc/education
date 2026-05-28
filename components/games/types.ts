export interface SessionResult {
  score: number;
  totalQ: number;
  correctQ: number;
  durationSec: number;
  starsEarned: number;
}

export type OnComplete = (r: SessionResult) => void;
