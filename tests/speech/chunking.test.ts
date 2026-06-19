import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { chunkCap, splitForTts } from "../../lib/speech/chunking.ts";

function assertValidChunks(text: string, chunks: string[], maxLen: number): void {
  assert.equal(chunks.join(""), text);
  assert.ok(chunks.every((chunk) => chunk.length > 0));
  chunks.forEach((chunk, index) => {
    assert.ok(
      Array.from(chunk).length <= chunkCap(index, maxLen),
      `chunk ${index} exceeds its cap: ${chunk}`,
    );
  });
}

function assertWordIsNotSplit(text: string, word: string, maxLen: number): void {
  const chunks = splitForTts(text, maxLen);
  assertValidChunks(text, chunks, maxLen);

  for (let index = 1; index < word.length; index++) {
    const left = word.slice(0, index);
    const right = word.slice(index);
    assert.ok(
      !chunks.some(
        (chunk, chunkIndex) =>
          chunk.endsWith(left) && (chunks[chunkIndex + 1] ?? "").startsWith(right),
      ),
      `split word "${word}" across chunks: ${JSON.stringify(chunks)}`,
    );
  }
}

test("keeps common Chinese words intact near a chunk cap", () => {
  assertWordIsNotSplit("大家抬起头望着天空很蓝。", "天空", 8);
  assertWordIsNotSplit("悟空的名声传到了天上很热闹。", "天上", 9);
  assertWordIsNotSplit("悟空决定一路去西天取经很重要。", "西天取经", 8);
  assertWordIsNotSplit(
    "美猴王在花果山快活了好些年，可有一天，他忽然闷闷不乐。",
    "闷闷不乐",
    24,
  );
});

test("keeps a closing quote with the sentence-ending punctuation", () => {
  const text = "悟空大喊：「太好了！」大家都笑了。";
  const chunks = splitForTts(text, 11);

  assertValidChunks(text, chunks, 11);
  assert.equal(chunks[0], "悟空大喊：「太好了！」");
});

test("preserves text exactly while respecting every dynamic cap", () => {
  const text =
    "第一段没有标点需要寻找自然词语边界第二段继续讲述天空和西天取经的故事最后结束。";
  const maxLen = 16;
  const chunks = splitForTts(text, maxLen);

  assertValidChunks(text, chunks, maxLen);
});
