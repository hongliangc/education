import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("对照卡渲染演义与史实两栏并带可信度提示", () => {
  const src = readFileSync("components/history/HistoryNoteCard.tsx", "utf8");
  // 两栏数据
  assert.match(src, /note\.romance/);
  assert.match(src, /note\.history/);
  // 演义 / 史书 双标签
  assert.match(src, /演义/);
  assert.match(src, /史书/);
  // 「三国群英·锦卷」绢面底色令牌
  assert.match(src, /#F3ECDA/);
  // 轻量可信度提示：演义有作家想象成分
  assert.match(src, /想象/);
});
