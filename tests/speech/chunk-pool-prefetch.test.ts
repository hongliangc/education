import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// 回归：长回复分段朗读在 iPhone 上每到段边界仍卡一下。
// 旧实现把每段改用【单个】共享元素播放（shared.src = objUrls[k] 后 play），段边界都要换 src→reload→卡顿。
// 修复：用 2 元素的预解锁播放池，相邻段落在不同元素上，段末直接 play() 无 reload。
// 见 bugfix/2026-06-21-fairy-chunk-boundary-stutter.md。

test("speech keeps a small pre-unlocked audio pool so adjacent chunks use different elements", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  // 至少 2 个元素，相邻段才能落在不同元素上（预取深度 1）。
  assert.match(source, /AUDIO_POOL_SIZE\s*=\s*2/);
  // 分段取池元素按段序轮流。
  assert.match(source, /getPooledAudio\(/);
  assert.match(source, /pool\[i % pool\.length\]/);
});

test("primeSpeechOutput unlocks every pooled element, not just one", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  // 必须在手势里点亮池中每个元素，否则非首段会被 iOS 拦回退、又退回段间 reload。
  assert.match(source, /for \(const el of pool\)/);
});

test("chunked playback no longer reloads a single shared element per segment", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  // 旧的「每段给同一个共享元素重设 src」兜底已删除——那正是段间卡顿的根因。
  assert.doesNotMatch(source, /shared\.src = objUrls\[k\]/);
});
