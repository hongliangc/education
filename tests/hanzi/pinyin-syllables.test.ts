import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { PINYIN_SYLLABLES } from "../../content/hanzi/pinyin-syllables.ts";

test("pinyin course covers the valid Mandarin syllable inventory", () => {
  assert.ok(PINYIN_SYLLABLES.length >= 400);
  assert.equal(new Set(PINYIN_SYLLABLES.map(({ syllable }) => syllable)).size, PINYIN_SYLLABLES.length);
  assert.ok(PINYIN_SYLLABLES.every(({ syllable, family, difficulty }) => syllable.length > 0 && family.length > 0 && difficulty >= 1 && difficulty <= 3));
});
