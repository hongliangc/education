import { test } from "node:test";
import assert from "node:assert/strict";

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
const countUpTo = (grade: Grade): number =>
  CATALOG.filter((word) => rank(word.grade) <= rank(grade)).length;

test("every catalog id is globally unique", () => {
  const ids = CATALOG.map((word) => word.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate word id detected");
});

test("ids follow the grade-prefixed slug format", () => {
  for (const word of CATALOG) {
    const expected = `${word.grade.toLowerCase()}-${word.en.replace(/\s+/g, "-")}`;
    assert.equal(word.id, expected, `unexpected id for ${word.en}`);
  }
});

test("every word fills the required fields", () => {
  for (const word of CATALOG) {
    for (const field of ["id", "en", "zh", "emoji", "category"] as const) {
      assert.ok(
        typeof word[field] === "string" && word[field].length > 0,
        `${word.id} has an empty ${field}`,
      );
    }
  }
});

test("every word carries a valid grade", () => {
  for (const word of CATALOG) {
    assert.ok(GRADES.includes(word.grade), `${word.id} has invalid grade ${word.grade}`);
  }
});

test("English words are unique within each grade", () => {
  for (const grade of GRADES) {
    const inGrade = CATALOG.filter((word) => word.grade === grade).map((word) =>
      word.en.toLowerCase(),
    );
    assert.equal(
      new Set(inGrade).size,
      inGrade.length,
      `duplicate English word within ${grade}`,
    );
  }
});

test("cumulative vocabulary meets the per-grade growth targets", () => {
  assert.ok(countUpTo("G1") >= 120, `G1 cumulative ${countUpTo("G1")} < 120`);
  assert.ok(countUpTo("G2") >= 220, `G2 cumulative ${countUpTo("G2")} < 220`);
  assert.ok(countUpTo("G3") >= 300, `G3 cumulative ${countUpTo("G3")} < 300`);
});

test("each band file only tags its own grade", () => {
  const bands: Array<[Grade[], GradedWord[]]> = [
    [["K1", "K2", "K3"], KINDERGARTEN_WORDS],
    [["G1"], GRADE_ONE_WORDS],
    [["G2"], GRADE_TWO_WORDS],
    [["G3"], GRADE_THREE_WORDS],
  ];
  for (const [allowed, words] of bands) {
    for (const word of words) {
      assert.ok(
        allowed.includes(word.grade),
        `${word.id} tagged ${word.grade}, not in ${allowed.join("/")}`,
      );
    }
  }
});
