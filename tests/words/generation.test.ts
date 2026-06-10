import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { wordsUpToGrade, pickRound } from "../../content/words/round.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { KINDERGARTEN_WORDS } from "../../content/words/kindergarten.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADE_ONE_WORDS } from "../../content/words/grade-one.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADE_TWO_WORDS } from "../../content/words/grade-two.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADE_THREE_WORDS } from "../../content/words/grade-three.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADES } from "../../lib/grades.ts";
import type { Grade } from "../../lib/grades";
import type { GradedWord } from "../../content/words";

const CATALOG: GradedWord[] = [
  ...KINDERGARTEN_WORDS,
  ...GRADE_ONE_WORDS,
  ...GRADE_TWO_WORDS,
  ...GRADE_THREE_WORDS,
];

const rank = (grade: Grade): number => GRADES.indexOf(grade);
const poolFor = (grade: Grade): GradedWord[] => wordsUpToGrade(CATALOG, grade, GRADES);

test("wordsUpToGrade returns only the grade and easier bands", () => {
  for (const grade of GRADES) {
    const pool = poolFor(grade);
    assert.ok(pool.length > 0, `${grade} pool is empty`);
    for (const word of pool) {
      assert.ok(rank(word.grade) <= rank(grade), `${word.id} is harder than ${grade}`);
    }
  }
});

test("wordsUpToGrade is strictly cumulative across grades", () => {
  for (let i = 1; i < GRADES.length; i++) {
    const smaller = poolFor(GRADES[i - 1]).length;
    const larger = poolFor(GRADES[i]).length;
    assert.ok(larger >= smaller, `${GRADES[i]} pool shrank below ${GRADES[i - 1]}`);
  }
  assert.equal(poolFor("G3").length, CATALOG.length, "G3 should include the whole catalog");
});

test("pickRound returns the requested count of distinct in-pool words", () => {
  const pool = poolFor("G1");
  const round = pickRound(pool, 4);
  assert.equal(round.length, 4);
  assert.equal(new Set(round.map((w) => w.id)).size, 4, "round has a duplicate word");
  for (const word of round) {
    assert.ok(pool.some((p) => p.id === word.id), `${word.id} is not from the pool`);
  }
});

test("pickRound caps at the pool size instead of padding or repeating", () => {
  const tiny = poolFor("K1").slice(0, 3);
  const round = pickRound(tiny, 10);
  assert.equal(round.length, 3);
  assert.equal(new Set(round.map((w) => w.id)).size, 3);
});

test("pickRound is deterministic under a seeded rng", () => {
  const pool = poolFor("G2");
  const seeded = () => {
    let s = 42;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };
  const a = pickRound(pool, 4, seeded()).map((w) => w.id);
  const b = pickRound(pool, 4, seeded()).map((w) => w.id);
  assert.deepEqual(a, b, "same seed should yield the same round");
});

test("a low-grade round never surfaces a harder word", () => {
  const round = pickRound(poolFor("K2"), 4);
  for (const word of round) {
    assert.ok(rank(word.grade) <= rank("K2"), `${word.id} leaked into a K2 round`);
  }
});
