import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { clampToAllowedGrade } from "../../lib/grades.ts";

test("clampToAllowedGrade keeps a grade within reach", () => {
  assert.equal(clampToAllowedGrade("G2", "G1"), "G1"); // lower is always fine
  assert.equal(clampToAllowedGrade("G2", "G3"), "G3"); // exactly one above is fine
  assert.equal(clampToAllowedGrade("K1", "K1"), "K1"); // own grade
});

test("clampToAllowedGrade falls back to the child's grade when out of reach", () => {
  assert.equal(clampToAllowedGrade("G1", "G3"), "G1"); // two above → fall back
  assert.equal(clampToAllowedGrade("K1", "G3"), "K1"); // far above → fall back
});
