import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
// @ts-expect-error 运行时用 --experimental-strip-types 直接载入 .ts
import { HISTORY_GUIDE_PROMPT } from "../../lib/fairy/historyPrompt.ts";

test("历史向导 prompt 要求区分史书/演义/传说/争议", () => {
  for (const k of ["史书", "演义", "传说", "争议"]) {
    assert.ok(HISTORY_GUIDE_PROMPT.includes(k), `prompt 含「${k}」`);
  }
});

test("fairy 路由按历史向导模式切换 prompt", () => {
  const src = readFileSync("app/api/fairy/chat/route.ts", "utf8");
  assert.match(src, /history/);
  assert.match(src, /HISTORY_GUIDE_PROMPT/);
});
