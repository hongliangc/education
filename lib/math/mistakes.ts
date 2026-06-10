import type { MathProblem } from "../../content/math";

// A mistake is simply the missed problem plus when it was recorded. The problem's `id`
// already embeds its grade, so mistakes are deduped and reviewed per grade automatically.
export type MathMistake = MathProblem & { addedAt: string };

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

export function toMistake(
  problem: MathProblem,
  addedAt = new Date().toISOString(),
): MathMistake {
  return { ...problem, addedAt };
}

export function mistakeToProblem(mistake: MathMistake): MathProblem {
  const { addedAt: _addedAt, ...problem } = mistake;
  return problem;
}
