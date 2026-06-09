import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { resolveSessionGrade, summarizeModuleGrade } from "../../lib/grades.ts";

test("a missing grade falls back to the LEGACY bucket", () => {
  const child = { gradeLevel: "G2", age: 7 };
  assert.equal(resolveSessionGrade(child, undefined), "LEGACY");
  assert.equal(resolveSessionGrade(child, null), "LEGACY");
  assert.equal(resolveSessionGrade(child, ""), "LEGACY");
});

test("an invalid grade string is rejected", () => {
  assert.equal(resolveSessionGrade({ gradeLevel: "G2", age: 7 }, "G4"), null);
  assert.equal(resolveSessionGrade({ gradeLevel: "G2", age: 7 }, 2), null);
});

test("a confirmed grade allows itself, one above, and any lower grade", () => {
  const child = { gradeLevel: "G2", age: 7 };
  assert.equal(resolveSessionGrade(child, "G2"), "G2");
  assert.equal(resolveSessionGrade(child, "G3"), "G3");
  assert.equal(resolveSessionGrade(child, "K1"), "K1");
});

test("a grade more than one above the child's maximum is rejected", () => {
  assert.equal(resolveSessionGrade({ gradeLevel: "G1", age: 6 }, "G3"), null);
});

test("an unconfirmed child is gated by the grade inferred from age", () => {
  const child = { gradeLevel: null, age: 7 }; // infers G2
  assert.equal(resolveSessionGrade(child, "G3"), "G3");
  assert.equal(resolveSessionGrade(child, "G4"), null);
});

test("module mastery and stars are scoped to one grade; LEGACY stays separate", () => {
  const sessions = [
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 3 },
    { gradeLevel: "LEGACY", totalQ: 10, correctQ: 0, starsEarned: 9 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 5, starsEarned: 2 },
  ];
  assert.deepEqual(summarizeModuleGrade(sessions, "G2"), {
    masteryPct: 75,
    stars: 5,
  });
  assert.deepEqual(summarizeModuleGrade(sessions, "LEGACY"), {
    masteryPct: 0,
    stars: 9,
  });
});

test("mastery uses only the five most recent sessions but stars sum the whole grade", () => {
  const sessions = [
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 1 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 1 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 1 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 1 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 10, starsEarned: 1 },
    { gradeLevel: "G2", totalQ: 10, correctQ: 0, starsEarned: 1 },
  ];
  assert.deepEqual(summarizeModuleGrade(sessions, "G2"), {
    masteryPct: 100,
    stars: 6,
  });
});

test("an empty history yields zero mastery and zero stars", () => {
  assert.deepEqual(summarizeModuleGrade([], "G1"), { masteryPct: 0, stars: 0 });
});
