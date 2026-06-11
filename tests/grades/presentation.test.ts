import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { progressKey, indexGradeProgress, resolveChildGrade, GRADE_LABELS } from "../../lib/grades.ts";

// The world summary and completion screens look progress up by a `<module>:<grade>` key so each
// grade keeps its own mastery, and pre-grade LEGACY rows never masquerade as current progress.

test("progressKey joins module and grade", () => {
  assert.equal(progressKey("MATH", "G2"), "MATH:G2");
  assert.equal(progressKey("WORDS", "K1"), "WORDS:K1");
});

test("grade labels are child-friendly Chinese", () => {
  assert.equal(GRADE_LABELS.K1, "幼儿园小班");
  assert.equal(GRADE_LABELS.G2, "二年级");
  assert.equal(GRADE_LABELS.G3, "三年级");
});

test("indexGradeProgress keys rows by module:grade and drops LEGACY", () => {
  const rows = [
    { module: "MATH", gradeLevel: "G2", stars: 9, masteryPct: 80 },
    { module: "MATH", gradeLevel: "LEGACY", stars: 30, masteryPct: 50 },
    { module: "WORDS", gradeLevel: "G1", stars: 6, masteryPct: 70 },
  ];
  const map = indexGradeProgress(rows);
  assert.equal(map.size, 2, "LEGACY row should be excluded");
  assert.equal(map.get("MATH:G2")?.stars, 9);
  assert.equal(map.get("WORDS:G1")?.masteryPct, 70);
  assert.equal(map.get("MATH:LEGACY"), undefined);
});

test("resolveChildGrade prefers a confirmed grade, else infers from age", () => {
  assert.equal(resolveChildGrade({ gradeLevel: "G3", age: 5 }), "G3");
  assert.equal(resolveChildGrade({ gradeLevel: null, age: 7 }), "G2");
  assert.equal(resolveChildGrade({ gradeLevel: "BOGUS", age: 3 }), "K1");
});
