import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses single-stream speech for fairy replies so unique answers play gaplessly", async () => {
  const source = await readFile(
    new URL("../../components/fairy/FairyChat.tsx", import.meta.url),
    "utf8",
  );

  // 回复每次唯一、永不命中缓存：分段会在每个段边界各等一次实时合成 → 段间卡顿。
  // 必须用单条连续流式（speakTextStream），未命中延迟只付一次、之后无段边界。
  // 见 bugfix/2026-06-21-fairy-uncached-chunk-gap.md。
  assert.match(source, /speakRef\.current = speakTextStream\(text,/);
  assert.doesNotMatch(source, /speakRef\.current = speakChunks\(text,/);
});

test("voice input failures show a concrete hint and keep permission errors retryable", async () => {
  const source = await readFile(
    new URL("../../components/fairy/FairyChat.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /console\.warn\("Fairy voice input failed:", error\)/);
  assert.match(source, /请在地址栏允许麦克风后重试/);
  assert.match(source, /setTyping\(false\)/);
  assert.match(source, /当前不是安全连接，需要 https 才能使用麦克风，已切到打字/);
  assert.match(source, /没找到麦克风，已切到打字/);
});
