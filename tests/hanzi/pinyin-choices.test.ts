import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { shufflePinyinChoices } from "../../content/hanzi/pinyin-choices.ts";

test("pinyin answers can appear in different positions", () => {
  const choices = ["a", "b", "c", "d"];
  const first = shufflePinyinChoices(choices, () => 0.999);
  const last = shufflePinyinChoices(choices, () => 0);

  assert.equal(first.indexOf("a"), 0);
  assert.equal(last.indexOf("a"), 3);
  assert.deepEqual([...last].sort(), choices);
  assert.deepEqual(choices, ["a", "b", "c", "d"]);
});
