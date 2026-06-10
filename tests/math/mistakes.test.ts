import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { addMistake, getMistakes, removeMistake, toMistake, type MathMistake, type MathMistakeStorage } from "../../lib/math/mistakes.ts";
import type { ArithmeticProblem } from "../../content/math.ts";

class MemoryStorage implements MathMistakeStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

function problem(question: string): ArithmeticProblem {
  return {
    kind: "arithmetic",
    id: `K1:arithmetic:${question}`,
    grade: "K1",
    op: "+",
    operands: [1, 2],
    prompt: question,
    answer: "3",
    choices: ["3", "4", "5", "6"],
  };
}

function mistake(question: string, addedAt: string): MathMistake {
  return toMistake(problem(question), addedAt);
}

test("mistakes are isolated by child id", () => {
  const storage = new MemoryStorage();
  addMistake("child-a", mistake("1 + 2", "2026-06-06T00:00:00.000Z"), storage);

  assert.equal(getMistakes("child-a", storage).length, 1);
  assert.deepEqual(getMistakes("child-b", storage), []);
});

test("the mistake id and record both carry the grade", () => {
  const record = mistake("1 + 2", "2026-06-06T00:00:00.000Z");
  assert.ok(record.id.startsWith("K1:"));
  assert.equal(record.grade, "K1");
});

test("adding the same question replaces the existing record", () => {
  const storage = new MemoryStorage();
  addMistake("child-a", mistake("1 + 2", "2026-06-06T00:00:00.000Z"), storage);
  addMistake("child-a", mistake("1 + 2", "2026-06-06T01:00:00.000Z"), storage);

  const records = getMistakes("child-a", storage);
  assert.equal(records.length, 1);
  assert.equal(records[0]?.addedAt, "2026-06-06T01:00:00.000Z");
});

test("mistake storage keeps the newest fifty records", () => {
  const storage = new MemoryStorage();
  for (let index = 0; index < 55; index++) {
    addMistake(
      "child-a",
      mistake(`${index} + 2`, new Date(Date.UTC(2026, 5, 6, 0, index)).toISOString()),
      storage,
    );
  }

  const records = getMistakes("child-a", storage);
  assert.equal(records.length, 50);
  assert.equal(records[0]?.prompt, "5 + 2");
  assert.equal(records.at(-1)?.prompt, "54 + 2");
});

test("removing a mastered mistake leaves other records intact", () => {
  const storage = new MemoryStorage();
  addMistake("child-a", mistake("1 + 2", "2026-06-06T00:00:00.000Z"), storage);
  addMistake("child-a", mistake("2 + 2", "2026-06-06T00:01:00.000Z"), storage);

  removeMistake("child-a", "K1:arithmetic:1 + 2", storage);

  assert.deepEqual(
    getMistakes("child-a", storage).map(({ id }) => id),
    ["K1:arithmetic:2 + 2"],
  );
});
