import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { toneMarkedSyllables } from "../../content/hanzi/pinyin-speech.ts";

test("tone marks follow pinyin placement rules for every lesson family", () => {
  assert.deepEqual(toneMarkedSyllables("ai"), ["āi", "ái", "ǎi", "ài"]);
  assert.deepEqual(toneMarkedSyllables("ui"), ["uī", "uí", "uǐ", "uì"]);
  assert.deepEqual(toneMarkedSyllables("iu"), ["iū", "iú", "iǔ", "iù"]);
  assert.deepEqual(toneMarkedSyllables("ün"), ["ǖn", "ǘn", "ǚn", "ǜn"]);
  assert.deepEqual(toneMarkedSyllables("zhi"), ["zhī", "zhí", "zhǐ", "zhì"]);
});
