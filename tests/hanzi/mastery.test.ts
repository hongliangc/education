import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { decideHanziNextAction, recordHanziEvidence } from "../../content/hanzi/mastery.ts";

test("recognition evidence does not mark writing as learned", () => {
  const progress = recordHanziEvidence({}, "hanzi:一", {
    capability: "recognition",
    gate: "UNDERSTAND",
    score: 90,
    independent: true,
    explanationPassed: true,
    assessedAt: 10,
  });

  assert.equal(progress["hanzi:一"].capabilities.recognition?.stage, "understanding");
  assert.equal(progress["hanzi:一"].capabilities.writing, undefined);
});

test("fluency requires two stable sets and mastery requires delayed evidence", () => {
  assert.equal(decideHanziNextAction({ gate: "FLUENT", score: 90, independent: true, hints: 0, setScores: [100, 80] }).decision, "RETRY");
  assert.equal(decideHanziNextAction({ gate: "FLUENT", score: 90, independent: true, hints: 1, setScores: [90, 88] }).decision, "PASS");
  assert.equal(decideHanziNextAction({ gate: "MASTER", score: 95, independent: true, hints: 0, delayedPassed: false }).decision, "DEFER");
  assert.equal(decideHanziNextAction({ gate: "MASTER", score: 95, independent: true, hints: 0, delayedPassed: true }).decision, "PASS");
});

test("transfer, conceptual gaps and prerequisites route to the right learning action", () => {
  assert.equal(decideHanziNextAction({ gate: "APPLY", score: 85, independent: true, hints: 0, novelTaskPassed: true, methodScore: 10, explanationScore: 10 }).decision, "PASS");
  assert.deepEqual(decideHanziNextAction({ gate: "REVIEW", score: 95, independent: true, hints: 0 }), { decision: "PASS", reviewAction: "LENGTHEN" });
  assert.deepEqual(decideHanziNextAction({ gate: "REVIEW", score: 85, independent: true, hints: 0 }), { decision: "PASS", reviewAction: "KEEP" });
  assert.deepEqual(decideHanziNextAction({ gate: "REVIEW", score: 70, independent: true, hints: 0 }), { decision: "RETRY", reviewAction: "SHORTEN" });
  assert.deepEqual(decideHanziNextAction({ gate: "REVIEW", score: 95, independent: true, hints: 0, errorType: "CONCEPT" }), { decision: "RETRY", reviewAction: "REOPEN" });
  assert.equal(decideHanziNextAction({ gate: "UNDERSTAND", score: 95, independent: true, hints: 0, errorType: "PREREQUISITE" }).decision, "BACKTRACK");
  assert.equal(decideHanziNextAction({ gate: "UNDERSTAND", score: 30, independent: true, hints: 0, remediationCycles: 2 }).decision, "DEFER");
});
