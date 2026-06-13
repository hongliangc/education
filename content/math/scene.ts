// Deterministic teaching storyboards for the two ten-frame strategies of within-20 arithmetic:
// 凑十法 (make-ten) for crossing-ten addition and 破十法 (break-ten) for borrowing subtraction.
// Each builder returns the ordered beats the renderer animates and the fairy narrates. Pure data
// — no React, no imports of components — so the SAME storyboard drives the animation for ANY
// random problem (8+5, 7+6, 13-5 …), not a fixed video.
import type { MathProblem } from "../math";

export type StepId =
  // make-ten add
  | "show"
  | "split"
  | "make-ten"
  | "carry"
  | "answer"
  // break-ten sub
  | "borrow"
  | "subtract"
  | "combine";

export interface SceneStep {
  id: StepId;
  caption: string; // fairy narration + the on-screen line for this beat
}

export interface MakeTenScene {
  kind: "make-ten-add";
  a: number; // first addend — fills the ten-frame
  b: number; // second addend — starts as loose dots
  need: number; // 10 - a : how many dots hop in to complete the ten
  rest: number; // b - need : what is left after making ten
  answer: number; // a + b
  steps: SceneStep[];
}

export interface BreakTenScene {
  kind: "break-ten-sub";
  a: number; // minuend (11–18): a full ten-frame plus `ones` loose dots
  b: number; // subtrahend (1–9), with ones < b so the ten must be broken
  ones: number; // a - 10 : the loose dots that can't cover b on their own
  fromTen: number; // 10 - b : what is left in the frame after taking b out of the ten
  answer: number; // a - b = fromTen + ones
  steps: SceneStep[];
}

export type TenFrameScene = MakeTenScene | BreakTenScene;

// Make-ten only helps when the first addend is below ten and the sum crosses ten; the caller
// decides when to use it. `need`/`rest` are derived so the renderer stays dumb.
export function buildMakeTenAdd(a: number, b: number): MakeTenScene {
  const need = Math.max(0, Math.min(b, 10 - a));
  const rest = b - need;
  const answer = a + b;
  const steps: SceneStep[] = [
    { id: "show", caption: `先看 ${a} 加 ${b}：上面 ${a} 个，下面 ${b} 个。` },
    { id: "split", caption: `${a} 还差 ${need} 个就凑满 10，把 ${b} 分成 ${need} 和 ${rest}。` },
    { id: "make-ten", caption: `把 ${need} 个送进十格里，和 ${a} 一起凑成 10。` },
    { id: "carry", caption: `十格满了，就是 10，再加上剩下的 ${rest}。` },
    { id: "answer", caption: `10 加 ${rest} 等于 ${answer}，所以 ${a} 加 ${b} 等于 ${answer}！` },
  ];
  return { kind: "make-ten-add", a, b, need, rest, answer, steps };
}

// Break-ten helps when the ones digit is too small to subtract from: take the whole subtrahend
// out of the ten, then add what's left of the ten back to the loose ones.
export function buildBreakTenSub(a: number, b: number): BreakTenScene {
  const ones = a - 10;
  const fromTen = 10 - b;
  const answer = a - b;
  const steps: SceneStep[] = [
    { id: "show", caption: `先看 ${a} 减 ${b}：十格里装满 10 个，外面还有 ${ones} 个。` },
    { id: "borrow", caption: `外面只有 ${ones} 个，不够减 ${b}，得把满满的十格拆开。` },
    { id: "subtract", caption: `从 10 里拿走 ${b} 个，十格里还剩 ${fromTen} 个。` },
    { id: "combine", caption: `十格剩的 ${fromTen} 个，和外面的 ${ones} 个合在一起。` },
    { id: "answer", caption: `${fromTen} 加 ${ones} 等于 ${answer}，所以 ${a} 减 ${b} 等于 ${answer}！` },
  ];
  return { kind: "break-ten-sub", a, b, ones, fromTen, answer, steps };
}

// Pick the ten-frame storyboard that fits a practice problem, or null when none applies (the
// caller then falls back to the generic step-by-step guide). Only the two within-20 carry/borrow
// cases animate well on a ten-frame; everything else (no carry, ×÷, fractions, …) returns null.
export function sceneForProblem(problem: MathProblem): TenFrameScene | null {
  if (problem.kind !== "arithmetic") return null;
  const [a, b] = problem.operands;
  if (problem.op === "+" && a >= 1 && a < 10 && b >= 1 && b < 10 && a + b > 10 && a + b <= 18) {
    return buildMakeTenAdd(a, b);
  }
  if (problem.op === "-" && a > 10 && a <= 18 && b >= 1 && b < 10 && a - 10 < b && a - b >= 1) {
    return buildBreakTenSub(a, b);
  }
  return null;
}
