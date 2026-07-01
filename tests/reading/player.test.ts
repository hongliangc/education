import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { activeIllustrationIndex, currentTokenIndex, illustrationSentenceIndex, nextSubtitleMode, readingProgressValue, splitEnglishWords, splitHanChars } from "../../lib/reading/player.ts";

test("splits subtitle text into highlightable English words and Chinese characters", () => {
  assert.deepEqual(splitEnglishWords("A Lion's paw."), ["A", "Lion's", "paw"]);
  assert.deepEqual(splitHanChars("善意 never 白费。"), ["善", "意", "白", "费"]);
});

test("maps playback fraction to the current subtitle token", () => {
  assert.equal(currentTokenIndex(5, 0), 0);
  assert.equal(currentTokenIndex(5, 0.49), 2);
  assert.equal(currentTokenIndex(5, 1), 4);
  assert.equal(currentTokenIndex(0, 0.5), -1);
});

test("builds a draggable story progress value from sentence and clip progress", () => {
  assert.equal(readingProgressValue(0, 0.5), 0.5);
  assert.equal(readingProgressValue(3, 0.25), 3.25);
});

test("selects the latest illustration whose sentence anchor has been reached", () => {
  const sentenceIds = ["s01", "s02", "s03", "s04", "s05"];
  const anchors = ["s01", "s03", "s05"];
  assert.equal(activeIllustrationIndex(sentenceIds, anchors, 0), 0);
  assert.equal(activeIllustrationIndex(sentenceIds, anchors, 2), 1);
  assert.equal(activeIllustrationIndex(sentenceIds, anchors, 4), 2);
});

test("maps an illustration back to the sentence it starts from", () => {
  const sentenceIds = ["s01", "s02", "s03", "s04", "s05"];
  const anchors = ["s01", "s03", "s05"];
  assert.equal(illustrationSentenceIndex(sentenceIds, anchors, 1), 2);
  assert.equal(illustrationSentenceIndex(sentenceIds, anchors, -1), 0);
  assert.equal(illustrationSentenceIndex(sentenceIds, anchors, 9), 4);
});

test("cycles subtitle display mode from bilingual through single-language and hidden", () => {
  assert.equal(nextSubtitleMode("both"), "english");
  assert.equal(nextSubtitleMode("english"), "chinese");
  assert.equal(nextSubtitleMode("chinese"), "hidden");
  assert.equal(nextSubtitleMode("hidden"), "both");
});
