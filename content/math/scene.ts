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
  | "combine"
  // ten-bond add/sub (within 10)
  | "part-a"
  | "part-b"
  | "bond"
  | "whole"
  | "remove"
  // array multiplication — one beat per row
  | "row"
  // equal-sharing division — one beat per dealing round
  | "round";

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

// 数的组成 (number bond) over a ten-frame, for within-10 add/sub. The two parts fill the single
// frame and a part-whole bond makes "5 和 3 合成 8" / "8 分成 5 和 3" explicit.
export interface TenBondScene {
  kind: "ten-bond";
  op: "+" | "-";
  a: number;
  b: number;
  whole: number; // the fullest the frame gets: a+b for add, a for sub
  parts: [number, number]; // the two children of the bond, together they make `whole`
  answer: number;
  steps: SceneStep[];
}

// 阵列 + 跳数 (array + skip-count) for table multiplication: `rows` rows of `cols` dots, lit row by
// row, with the running totals as the skip-count (4, 8, 12 …).
export interface ArrayScene {
  kind: "array-mul";
  a: number;
  b: number;
  rows: number;
  cols: number;
  product: number;
  answer: number;
  skipCounts: number[]; // running total after each row: [cols, 2*cols, …, rows*cols]
  steps: SceneStep[];
}

// 平均分 (equal sharing) for table division: deal `total` counters one at a time into `baskets`
// baskets; each basket ends with the quotient.
export interface ShareScene {
  kind: "share-div";
  a: number;
  b: number;
  total: number;
  baskets: number;
  per: number; // counters per basket = the quotient
  answer: number;
  steps: SceneStep[];
}

// Every storyboard the player can drive.
export type Storyboard = TenFrameScene | TenBondScene | ArrayScene | ShareScene;

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

// 数的组成 · 加法 (within 10): place `a`, then `b`, into one frame; the bond shows the two parts.
export function buildTenBondAdd(a: number, b: number): TenBondScene {
  const whole = a + b;
  const steps: SceneStep[] = [
    { id: "show", caption: `先看 ${a} 加 ${b}。` },
    { id: "part-a", caption: `先在十格里放 ${a} 个。` },
    { id: "part-b", caption: `再放进 ${b} 个。` },
    { id: "bond", caption: `${a} 和 ${b} 合起来。` },
    { id: "answer", caption: `一共 ${whole} 个，${a} 加 ${b} 等于 ${whole}！` },
  ];
  return { kind: "ten-bond", op: "+", a, b, whole, parts: [a, b], answer: whole, steps };
}

// 数的组成 · 减法 (within 10): fill `a`, take `b` away; the bond shows `a` split into kept + removed.
export function buildTenBondSub(a: number, b: number): TenBondScene {
  const answer = a - b;
  const steps: SceneStep[] = [
    { id: "show", caption: `先看 ${a} 减 ${b}。` },
    { id: "whole", caption: `先在十格里放 ${a} 个。` },
    { id: "remove", caption: `拿走 ${b} 个。` },
    { id: "bond", caption: `${a} 分成 ${b} 和 ${answer}。` },
    { id: "answer", caption: `还剩 ${answer} 个，${a} 减 ${b} 等于 ${answer}！` },
  ];
  return { kind: "ten-bond", op: "-", a, b, whole: a, parts: [answer, b], answer, steps };
}

// 阵列 + 跳数 (table multiplication): one beat per row — frame the new row of `b` and add it into
// the running total, so the skip-count (b, 2b, …) grows in front of the child.
export function buildArrayMul(a: number, b: number): ArrayScene {
  const product = a * b;
  const skipCounts = Array.from({ length: a }, (_, i) => (i + 1) * b);
  const rowSteps: SceneStep[] = skipCounts.map((total, i) => {
    const r = i + 1;
    if (r === 1) return { id: "row", caption: `第 1 行 ${b} 个，先数到 ${b}。` };
    return { id: "row", caption: `框住第 ${r} 行：${skipCounts[i - 1]} 加 ${b}，一共 ${total}。` };
  });
  const steps: SceneStep[] = [
    { id: "show", caption: `看 ${a} 乘 ${b}，就是 ${a} 个 ${b} 加起来。` },
    ...rowSteps,
    { id: "answer", caption: `${a} 行，每行 ${b} 个，一共 ${product}，${a} 乘 ${b} 等于 ${product}！` },
  ];
  return { kind: "array-mul", a, b, rows: a, cols: b, product, answer: product, skipCounts, steps };
}

// 平均分 (table division): one beat per dealing round — each round drops one counter into every
// basket, so the child watches the share build up evenly until the pile is gone.
export function buildShareDiv(a: number, b: number): ShareScene {
  const per = a / b;
  const roundSteps: SceneStep[] = Array.from({ length: per }, (_, i) => {
    const r = i + 1;
    if (r === 1) return { id: "round", caption: `第 1 轮：每个篮子先放 1 个。` };
    return { id: "round", caption: `第 ${r} 轮：每篮再放 1 个，现在每篮 ${r} 个。` };
  });
  const steps: SceneStep[] = [
    { id: "show", caption: `看 ${a} 除以 ${b}：把 ${a} 个平均分给 ${b} 个篮子，一人一个地发。` },
    ...roundSteps,
    { id: "answer", caption: `每个篮子分到 ${per} 个，${a} 除以 ${b} 等于 ${per}！` },
  ];
  return { kind: "share-div", a, b, total: a, baskets: b, per, answer: per, steps };
}

// Pick the storyboard that fits a supported arithmetic problem. Other problem kinds and arithmetic
// outside the teaching ranges fall back to the generic guide.
export function sceneForProblem(problem: MathProblem): Storyboard | null {
  if (problem.kind !== "arithmetic") return null;
  const [a, b] = problem.operands;

  if (problem.op === "+") {
    if (a >= 1 && a <= 9 && b >= 1 && b <= 9 && a + b >= 11 && a + b <= 18) {
      return buildMakeTenAdd(a, b);
    }
    if (a >= 1 && b >= 1 && a + b <= 10) {
      return buildTenBondAdd(a, b);
    }
    return null;
  }

  if (problem.op === "-") {
    if (a >= 11 && a <= 18 && b >= 1 && b <= 9 && a - 10 < b && a - b >= 1) {
      return buildBreakTenSub(a, b);
    }
    if (a <= 10 && b >= 1 && b <= a) {
      return buildTenBondSub(a, b);
    }
    return null;
  }

  if (problem.op === "×" && a >= 1 && a <= 9 && b >= 1 && b <= 9) {
    return buildArrayMul(a, b);
  }

  if (problem.op === "÷" && b >= 1 && b <= 9 && a % b === 0) {
    const quotient = a / b;
    if (quotient >= 1 && quotient <= 9) return buildShareDiv(a, b);
  }

  return null;
}
