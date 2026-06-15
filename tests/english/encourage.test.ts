import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { gradeAttempt } from "../../content/english/encourage.ts";

// The "encourage-first, never block" rule (design §4): a correct try celebrates; a miss earns one
// gentle retry; a second miss passes anyway (soft) so a young child is never stuck on pronunciation.
test("a correct attempt is celebrated regardless of attempt number", () => {
  assert.equal(gradeAttempt(true, 1), "correct");
  assert.equal(gradeAttempt(true, 2), "correct");
});

test("the first miss asks for one gentle retry", () => {
  assert.equal(gradeAttempt(false, 1), "retry");
});

test("the second miss passes anyway (soft), never blocking the child", () => {
  assert.equal(gradeAttempt(false, 2), "softpass");
});

test("respects a custom retry budget", () => {
  // maxAttempts = 1 → no retry, the very first miss soft-passes.
  assert.equal(gradeAttempt(false, 1, 1), "softpass");
});
