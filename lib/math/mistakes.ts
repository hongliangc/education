import type { MathOperator, MathProblem, MathTier } from "../../content/math";

export interface MathMistake {
  id: string;
  tier: MathTier;
  op: MathOperator;
  question: string;
  answer: number;
  addedAt: string;
}

export interface MathMistakeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const MAX_MISTAKES = 50;

function keyFor(childId: string): string {
  return `mlk:mathMistakes:${childId}`;
}

function browserStorage(): MathMistakeStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function read(storage: MathMistakeStorage | null, childId: string): MathMistake[] {
  if (!storage) return [];

  try {
    const value: unknown = JSON.parse(storage.getItem(keyFor(childId)) ?? "[]");
    return Array.isArray(value) ? (value as MathMistake[]) : [];
  } catch {
    return [];
  }
}

export function getMistakes(
  childId: string,
  storage: MathMistakeStorage | null = browserStorage(),
): MathMistake[] {
  return read(storage, childId);
}

export function addMistake(
  childId: string,
  mistake: MathMistake,
  storage: MathMistakeStorage | null = browserStorage(),
): MathMistake[] {
  if (!storage) return [];

  const next = [...read(storage, childId).filter(({ id }) => id !== mistake.id), mistake].slice(
    -MAX_MISTAKES,
  );
  storage.setItem(keyFor(childId), JSON.stringify(next));
  return next;
}

export function removeMistake(
  childId: string,
  mistakeId: string,
  storage: MathMistakeStorage | null = browserStorage(),
): MathMistake[] {
  if (!storage) return [];

  const next = read(storage, childId).filter(({ id }) => id !== mistakeId);
  storage.setItem(keyFor(childId), JSON.stringify(next));
  return next;
}

export function toMistake(problem: MathProblem, addedAt = new Date().toISOString()): MathMistake {
  return {
    id: `${problem.tier}:${problem.question}`,
    tier: problem.tier,
    op: problem.op,
    question: problem.question,
    answer: problem.answer,
    addedAt,
  };
}

export function mistakeToProblem(mistake: MathMistake): MathProblem {
  const [left, right] = mistake.question.split(` ${mistake.op} `).map(Number);
  return {
    question: mistake.question,
    answer: mistake.answer,
    op: mistake.op,
    operands: [left, right],
    tier: mistake.tier,
  };
}
