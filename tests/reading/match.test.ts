import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { matchSpokenSentence } from "../../lib/reading/match.ts";

// Lenient, coverage-based judge for sentence follow-along: a young child reading a whole sentence
// aloud should be encouraged on a good-enough attempt, never trapped on a perfect one.
const TARGET = "The little mouse ran across his nose.";

test("empty or blank speech is a miss (UI then offers a gentle retry / self-confirm)", () => {
  assert.deepEqual(matchSpokenSentence("", TARGET), { coverage: 0, passed: false });
  assert.deepEqual(matchSpokenSentence("   ", TARGET), { coverage: 0, passed: false });
});

test("a faithful read passes with full coverage, ignoring case and punctuation", () => {
  const r = matchSpokenSentence("the little mouse ran across his nose", TARGET);
  assert.equal(r.coverage, 1);
  assert.equal(r.passed, true);
});

test("a partial read above half the words still passes (encouraging)", () => {
  // 4 of 7 words → ~0.57 ≥ 0.5
  const r = matchSpokenSentence("little mouse ran nose", TARGET);
  assert.ok(r.coverage >= 0.5, `coverage ${r.coverage} should clear the bar`);
  assert.equal(r.passed, true);
});

test("only a couple of words is below the bar (gentle retry, not a pass)", () => {
  // 2 of 7 words → ~0.29 < 0.5
  const r = matchSpokenSentence("the nose", TARGET);
  assert.ok(r.coverage < 0.5, `coverage ${r.coverage} should be under the bar`);
  assert.equal(r.passed, false);
});

test("small mispronunciations still count via edit-distance tolerance", () => {
  // "littel" → little, "moose" → mouse, "acros" → across, "noze" → nose
  const r = matchSpokenSentence("the littel moose ran acros his noze", TARGET);
  assert.equal(r.coverage, 1);
  assert.equal(r.passed, true);
});

test("repeated target words each need their own spoken word", () => {
  // Saying "the" once must not cover both "the"s in the target.
  const r = matchSpokenSentence("the the the", "the cat sat on the mat");
  // target has 6 words incl. two "the"; "the the the" supplies two distinct "the" hits → 2/6.
  assert.ok(r.coverage <= 2 / 6 + 1e-9, `coverage ${r.coverage} should not over-count repeats`);
  assert.equal(r.passed, false);
});

test("an empty target trivially passes (defensive — nothing to read)", () => {
  assert.deepEqual(matchSpokenSentence("anything", ""), { coverage: 1, passed: true });
});
