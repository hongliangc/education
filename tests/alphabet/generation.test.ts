import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateRound, getGradeSkills, isLetterDisplaySkill } from "../../content/phonics.ts";
import type { AlphabetQuestion, AlphabetSkill } from "../../content/phonics.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADES } from "../../lib/grades.ts";
import type { Grade } from "../../lib/grades.ts";

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Generation is random, so sample many rounds and assert structural invariants.
function sample(grade: Grade, rounds = 80, n = 5): AlphabetQuestion[] {
  const all: AlphabetQuestion[] = [];
  for (let i = 0; i < rounds; i++) all.push(...generateRound(grade, n));
  return all;
}

function bySkill(skill: AlphabetSkill): AlphabetQuestion[] {
  return GRADES.flatMap((grade: Grade) => sample(grade)).filter((q) => q.skill === skill);
}

test("each grade maps to its phonics skill progression", () => {
  assert.deepEqual(getGradeSkills("K1"), ["LETTER_SHAPE", "CASE_MATCH"]);
  assert.deepEqual(getGradeSkills("K2"), ["CASE_MATCH", "LETTER_SOUND", "INITIAL_SOUND"]);
  assert.deepEqual(getGradeSkills("K3"), ["LETTER_SOUND", "INITIAL_SOUND", "CVC"]);
  assert.deepEqual(getGradeSkills("G1"), ["INITIAL_SOUND", "CVC"]);
  assert.deepEqual(getGradeSkills("G2"), ["LONG_VOWEL", "DIGRAPH"]);
  assert.deepEqual(getGradeSkills("G3"), ["DIGRAPH", "BLEND", "WORD_FAMILY"]);
});

test("every generated question is well-formed and grade-scoped", () => {
  for (const grade of GRADES as Grade[]) {
    const allowed = new Set(getGradeSkills(grade));
    for (const q of sample(grade)) {
      assert.equal(q.grade, grade);
      assert.ok(allowed.has(q.skill), `${grade} produced unexpected skill ${q.skill}`);
      assert.ok(q.id.length > 0);
      assert.ok(q.prompt.length > 0);
      assert.ok(q.choices.includes(q.answer), `answer missing from choices in ${q.id}`);
      assert.equal(new Set(q.choices).size, q.choices.length, `duplicate choice in ${q.id}`);
      assert.ok(q.choices.length >= 3 && q.choices.length <= 4);
      assert.ok(q.speak.text.length > 0);
    }
  }
});

test("a round has five distinct questions", () => {
  const round = generateRound("K3");
  assert.equal(round.length, 5);
  assert.equal(new Set(round.map((q) => q.id)).size, 5);
});

test("letter-shape questions match an uppercase letter to its tile", () => {
  const questions = bySkill("LETTER_SHAPE");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.match(q.answer, /^[A-Z]$/);
    assert.equal(q.letter?.upper, q.answer);
  }
});

test("case-match questions ask for the uppercase partner of a lowercase letter", () => {
  const questions = bySkill("CASE_MATCH");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.match(q.answer, /^[A-Z]$/);
    assert.equal(q.letter?.lower, q.answer.toLowerCase());
  }
});

test("letter-sound questions pair a letter with a word that starts with it", () => {
  const questions = bySkill("LETTER_SOUND");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.ok(q.letter, `letter focus missing in ${q.id}`);
    assert.equal(q.answer[0]?.toUpperCase(), q.letter?.upper);
  }
});

test("initial-sound questions ask for the first letter of a pictured word", () => {
  const questions = bySkill("INITIAL_SOUND");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.match(q.answer, /^[A-Z]$/);
    assert.equal(q.word?.[0]?.toUpperCase(), q.answer);
  }
});

test("CVC questions hide a short vowel", () => {
  const questions = bySkill("CVC");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.ok(VOWELS.has(q.answer), `${q.answer} is not a short vowel`);
    assert.ok(q.masked?.includes("_"));
  }
});

test("long-vowel questions hide a long vowel", () => {
  const questions = bySkill("LONG_VOWEL");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    assert.ok(VOWELS.has(q.answer));
    assert.ok(q.masked?.includes("_"));
  }
});

test("digraph and blend questions ask for a two-letter onset", () => {
  for (const skill of ["DIGRAPH", "BLEND"] as const) {
    const questions = bySkill(skill);
    assert.ok(questions.length > 0, `no ${skill} questions generated`);
    for (const q of questions) {
      assert.equal(q.answer.length, 2);
      assert.ok(q.masked?.includes("_"));
    }
  }
});

test("word-family questions keep the answer inside the family rime", () => {
  const questions = bySkill("WORD_FAMILY");
  assert.ok(questions.length > 0);
  for (const q of questions) {
    const rime = q.masked?.replace("-", "") ?? "";
    assert.ok(rime.length > 0);
    assert.ok(q.answer.endsWith(rime), `${q.answer} not in family -${rime}`);
    assert.notEqual(q.answer, q.word);
  }
});

test("display dispatch separates letter tiles from phonics cards", () => {
  assert.equal(isLetterDisplaySkill("LETTER_SHAPE"), true);
  assert.equal(isLetterDisplaySkill("CASE_MATCH"), true);
  assert.equal(isLetterDisplaySkill("INITIAL_SOUND"), false);
  assert.equal(isLetterDisplaySkill("CVC"), false);
  assert.equal(isLetterDisplaySkill("WORD_FAMILY"), false);
});
