import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { matchSpokenWord } from "../../content/english/match.ts";

// The closed-set, encourage-first judge for the "say it aloud" steps (design §4): given what the
// child said (ASR transcript) and ONLY this lesson's words, decide if it counts and which word it is.
const FRUITS = [
  { id: "apple", en: "apple" },
  { id: "banana", en: "banana" },
  { id: "orange", en: "orange" },
  { id: "grapes", en: "grapes" },
] as const;

test("rejects an empty or blank transcript (so the UI can offer a retry / self-confirm)", () => {
  assert.deepEqual(matchSpokenWord("", FRUITS), { matched: false, bestId: null });
  assert.deepEqual(matchSpokenWord("   ", FRUITS), { matched: false, bestId: null });
});

test("matches an exact word, ignoring case and punctuation", () => {
  assert.deepEqual(matchSpokenWord("Apple!", FRUITS), { matched: true, bestId: "apple" });
  assert.deepEqual(matchSpokenWord("  banana  ", FRUITS), { matched: true, bestId: "banana" });
});

test("matches when the lesson word is embedded in a phrase the child says", () => {
  // Role-play: "I want apples, please." — closed set still recognizes the fruit.
  const r = matchSpokenWord("I want apples, please.", FRUITS);
  assert.equal(r.matched, true);
  assert.equal(r.bestId, "apple");
});

test("tolerates a small mispronunciation via edit distance", () => {
  assert.deepEqual(matchSpokenWord("aple", FRUITS), { matched: true, bestId: "apple" });
  assert.deepEqual(matchSpokenWord("ornge", FRUITS), { matched: true, bestId: "orange" });
});

test("rejects a clearly different word (outside the closed set)", () => {
  const r = matchSpokenWord("elephant", FRUITS);
  assert.equal(r.matched, false);
});
