import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { canAccessGrade, getFoundationGrades, getRecommendedGrades, inferGradeFromAge, isGrade } from "../../lib/grades.ts";

test("infers the kindergarten/grade band from a child's age", () => {
  assert.equal(inferGradeFromAge(3), "K1");
  assert.equal(inferGradeFromAge(7), "G2");
});

test("clamps ages outside the K1-G3 range", () => {
  assert.equal(inferGradeFromAge(2), "K1");
  assert.equal(inferGradeFromAge(12), "G3");
});

test("recommends a window of one grade below through one above", () => {
  assert.deepEqual(getRecommendedGrades("G2"), ["G1", "G2", "G3"]);
  assert.deepEqual(getRecommendedGrades("K1"), ["K1", "K2"]);
  assert.deepEqual(getRecommendedGrades("G3"), ["G2", "G3"]);
});

test("foundation grades are the kindergarten tiers below the current grade", () => {
  assert.deepEqual(getFoundationGrades("G2"), ["K1", "K2", "K3"]);
  assert.deepEqual(getFoundationGrades("K3"), ["K1", "K2"]);
  assert.deepEqual(getFoundationGrades("K1"), []);
});

test("a child may access any valid grade up to one above their own", () => {
  assert.equal(canAccessGrade("G2", "G3"), true);
  assert.equal(canAccessGrade("G2", "K1"), true);
  assert.equal(canAccessGrade("G2", "G4"), false);
});

test("isGrade guards the K1-G3 range", () => {
  assert.equal(isGrade("K1"), true);
  assert.equal(isGrade("G3"), true);
  assert.equal(isGrade("G4"), false);
  assert.equal(isGrade("legacy"), false);
});
