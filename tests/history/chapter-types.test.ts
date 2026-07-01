import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("Chapter 类型新增 historyNote / cardKeys 可选字段", () => {
  const src = readFileSync("content/storybooks/types.ts", "utf8");
  assert.match(src, /historyNote\?:\s*\{\s*romance:\s*string;\s*history:\s*string\s*\}/);
  assert.match(src, /cardKeys\?:\s*string\[\]/);
});
