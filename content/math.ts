export type MathTier = "BASIC" | "MID" | "ADVANCED";
export type MathOperator = "+" | "-" | "×" | "÷";

export interface MathProblem {
  question: string;
  answer: number;
  op: MathOperator;
  operands: [number, number];
  tier: MathTier;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = randomInt(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
  return items;
}

function problem(
  tier: MathTier,
  op: MathOperator,
  left: number,
  right: number,
  answer: number,
): MathProblem {
  return {
    question: `${left} ${op} ${right}`,
    answer,
    op,
    operands: [left, right],
    tier,
  };
}

function generateBasic(): MathProblem {
  if (Math.random() < 0.5) {
    const left = randomInt(0, 10);
    const right = randomInt(0, 10 - left);
    return problem("BASIC", "+", left, right, left + right);
  }

  const left = randomInt(0, 10);
  const right = randomInt(0, left);
  return problem("BASIC", "-", left, right, left - right);
}

function generateMidCarryOrBorrow(): MathProblem {
  if (Math.random() < 0.5) {
    const leftOnes = randomInt(1, 9);
    const rightOnes = randomInt(10 - leftOnes, 9);
    const maxTensSum = Math.floor((100 - leftOnes - rightOnes) / 10);
    const leftTens = randomInt(1, Math.max(1, maxTensSum));
    const rightTens = randomInt(0, Math.max(0, maxTensSum - leftTens));
    const left = leftTens * 10 + leftOnes;
    const right = rightTens * 10 + rightOnes;
    return problem("MID", "+", left, right, left + right);
  }

  const leftTens = randomInt(2, 9);
  const leftOnes = randomInt(0, 8);
  const rightTens = randomInt(1, leftTens - 1);
  const rightOnes = randomInt(leftOnes + 1, 9);
  const left = leftTens * 10 + leftOnes;
  const right = rightTens * 10 + rightOnes;
  return problem("MID", "-", left, right, left - right);
}

function generateMid(): MathProblem {
  if (Math.random() < 0.5) {
    const left = randomInt(10, 90);
    const right = randomInt(1, 100 - left);
    return problem("MID", "+", left, right, left + right);
  }

  const left = randomInt(10, 100);
  const right = randomInt(1, left);
  return problem("MID", "-", left, right, left - right);
}

function generateAdvanced(): MathProblem {
  const factor = randomInt(1, 9);
  const otherFactor = randomInt(1, 9);
  if (Math.random() < 0.5) {
    return problem("ADVANCED", "×", factor, otherFactor, factor * otherFactor);
  }

  const dividend = factor * otherFactor;
  return problem("ADVANCED", "÷", dividend, factor, otherFactor);
}

export function generateRound(tier: MathTier, n = 5): MathProblem[] {
  if (n <= 0) return [];

  if (tier === "BASIC") {
    return Array.from({ length: n }, generateBasic);
  }
  if (tier === "ADVANCED") {
    return Array.from({ length: n }, generateAdvanced);
  }

  return shuffle([
    generateMidCarryOrBorrow(),
    ...Array.from({ length: n - 1 }, generateMid),
  ]);
}

export function generateChoices(answer: number, tier: MathTier): number[] {
  const windowSize = tier === "MID" ? 12 : tier === "ADVANCED" ? 9 : 4;
  const candidates: number[] = [];

  for (let delta = 1; delta <= windowSize; delta++) {
    candidates.push(answer - delta, answer + delta);
  }

  const choices = new Set<number>([answer]);
  for (const candidate of shuffle(candidates)) {
    if (candidate >= 0) choices.add(candidate);
    if (choices.size === 4) break;
  }

  return shuffle(Array.from(choices));
}
