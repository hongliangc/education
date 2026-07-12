import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript runner requires the explicit extension.
import { HANZI_KEY_WORDS } from "../../content/hanzi/words.ts";

test("key word writing set contains 200 words backed by catalog characters", () => {
  assert.equal(HANZI_KEY_WORDS.length, 200);
  assert.equal(new Set(HANZI_KEY_WORDS.map(({ word }) => word)).size, 200);
  assert.ok(HANZI_KEY_WORDS.every(({ word, items, example }) => [...word].length === items.length && example.includes(word)));
  for (const level of ["G1", "G2", "G3", "G4", "G5", "G6"]) {
    assert.ok(HANZI_KEY_WORDS.filter((word) => word.level === level).length >= 30, `${level} needs its own word set`);
  }
});
