import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// 回归：云 TTS 不可用 / 某段失败回退到浏览器原生 Web Speech 时，会把回复里的 emoji 念出来
// （「✨🤔」读成 sparkles / thinking face），机械音读 emoji 很出戏。
// 服务端 sanitizeForTts 只净化腾讯云路径；Web Speech 回退必须自己净化。
test("strips emoji before the browser Web Speech fallback so it never reads emoji aloud", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  assert.match(source, /function sanitizeForSpeech/);
  assert.match(source, /\\p\{Extended_Pictographic\}/);
  // Web Speech 朗读的必须是净化后的副本，而非含 emoji 的原始 text。
  assert.match(source, /new SpeechSynthesisUtterance\(spoken\)/);
});
