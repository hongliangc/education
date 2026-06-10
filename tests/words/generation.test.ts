import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { wordsUpToGrade, pickRound, usesMatchingGrid, roundKindsForGrade, generateChallenges } from "../../content/words/round.ts";
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
import type { WordChallenge } from "../../content/words/round";

const CATALOG: GradedWord[] = [
  ...KINDERGARTEN_WORDS,
  ...GRADE_ONE_WORDS,
  ...GRADE_TWO_WORDS,
  ...GRADE_THREE_WORDS,
];

const rank = (grade: Grade): number => GRADES.indexOf(grade);
const poolFor = (grade: Grade): GradedWord[] => wordsUpToGrade(CATALOG, grade, GRADES);
const wordById = (id: string): GradedWord | undefined => CATALOG.find((w) => w.id === id);
const challengesFor = (grade: Grade, count = 5): WordChallenge[] =>
  generateChallenges(poolFor(grade), grade, count);

// ---------------------------------------------------------------------------
// Cumulative pool selection
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Grade-dispatched challenge model (design §4.3)
// ---------------------------------------------------------------------------

test("kindergarten uses the matching grid, primary grades use challenges", () => {
  for (const grade of ["K1", "K2", "K3"] as const) {
    assert.equal(usesMatchingGrid(grade), true, `${grade} should match on the grid`);
    assert.deepEqual(roundKindsForGrade(grade), [], `${grade} should have no challenge kinds`);
  }
  for (const grade of ["G1", "G2", "G3"] as const) {
    assert.equal(usesMatchingGrid(grade), false, `${grade} should use challenges`);
  }
});

test("each primary grade unlocks its expected challenge kinds", () => {
  assert.deepEqual(roundKindsForGrade("G1"), ["en-image", "listen"]);
  assert.deepEqual(roundKindsForGrade("G2"), ["phrase"]);
  assert.deepEqual(roundKindsForGrade("G3"), ["sentence"]);
});

test("G1 rounds are English-to-image and listening with picture choices", () => {
  const round = challengesFor("G1");
  assert.equal(round.length, 5);
  for (const q of round) {
    assert.ok(["en-image", "listen"].includes(q.kind), `unexpected G1 kind ${q.kind}`);
    assert.equal(q.choiceMode, "emoji");
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map((c) => c.emoji)).size, 4, "duplicate picture choice");
    assert.ok(q.choices.some((c) => c.id === q.answerId), "answer missing from choices");
    const answer = wordById(q.answerId);
    assert.ok(answer, `unknown answer ${q.answerId}`);
    assert.equal(q.speak?.text, answer!.en, "should speak the English word");
    if (q.kind === "en-image") {
      assert.ok(q.prompt.toLowerCase().includes(answer!.en.toLowerCase()), "prompt names the word");
    }
  }
});

test("G2 rounds present a phrase that still names the word", () => {
  const round = challengesFor("G2");
  for (const q of round) {
    assert.equal(q.kind, "phrase");
    assert.equal(q.choiceMode, "emoji");
    const answer = wordById(q.answerId);
    assert.ok(answer, `unknown answer ${q.answerId}`);
    assert.ok(q.prompt.toLowerCase().includes(answer!.en.toLowerCase()), "phrase omits the word");
    assert.ok(q.prompt.split(/\s+/).length >= 2, "phrase should be more than one word");
  }
});

test("G3 rounds blank the word inside a sentence and offer word choices", () => {
  const round = challengesFor("G3");
  for (const q of round) {
    assert.equal(q.kind, "sentence");
    assert.equal(q.choiceMode, "word");
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map((c) => c.id)).size, 4, "duplicate word choice");
    assert.ok(q.prompt.includes("______"), "sentence is missing its blank");
    const answer = wordById(q.answerId);
    assert.ok(answer?.example, "sentence answer must ship an example");
    for (const choice of q.choices) {
      assert.ok(wordById(choice.id)?.example, `choice ${choice.id} should be a sentence word`);
    }
  }
});

test("a challenge round never repeats the same answer word", () => {
  for (const grade of ["G1", "G2", "G3"] as const) {
    const ids = challengesFor(grade).map((q) => q.answerId);
    assert.equal(new Set(ids).size, ids.length, `${grade} round repeats an answer`);
  }
});

test("challenge generation is deterministic under a seeded rng", () => {
  const seeded = () => {
    let s = 7;
    return () => {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    };
  };
  const pool = poolFor("G3");
  const a = generateChallenges(pool, "G3", 5, seeded()).map((q) => `${q.answerId}:${q.prompt}`);
  const b = generateChallenges(pool, "G3", 5, seeded()).map((q) => `${q.answerId}:${q.prompt}`);
  assert.deepEqual(a, b, "same seed should yield the same challenges");
});
