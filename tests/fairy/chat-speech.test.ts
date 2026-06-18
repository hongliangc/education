import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses chunked speech for fairy replies so long answers continue to the end", async () => {
  const source = await readFile(
    new URL("../../components/fairy/FairyChat.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /speakRef\.current = speakChunks\(text,/);
  assert.doesNotMatch(source, /speakRef\.current = speakTextStream\(text,/);
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
