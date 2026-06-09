import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildGradeSelection } from "../../lib/grades.ts";

// The picker shows a primary window (one grade below through one above, clamped) and
// collapses every grade below that window — including earlier primary-school grades — into
// a "more foundation" group.

test("a kindergarten starter sees only the upward window and no foundation", () => {
  assert.deepEqual(buildGradeSelection("K1"), {
    primary: ["K1", "K2"],
    foundation: [],
  });
});

test("the last kindergarten grade folds the earliest tier into foundation", () => {
  assert.deepEqual(buildGradeSelection("K3"), {
    primary: ["K2", "K3", "G1"],
    foundation: ["K1"],
  });
});

test("a mid primary grade keeps kindergarten as foundation", () => {
  assert.deepEqual(buildGradeSelection("G2"), {
    primary: ["G1", "G2", "G3"],
    foundation: ["K1", "K2", "K3"],
  });
});

test("the top grade folds the lower primary grade into foundation too", () => {
  assert.deepEqual(buildGradeSelection("G3"), {
    primary: ["G2", "G3"],
    foundation: ["K1", "K2", "K3", "G1"],
  });
});
