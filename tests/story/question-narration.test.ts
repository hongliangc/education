import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { QUESTION_REPLAY_LABEL, startQuestionNarration } from "../../components/games/story/questionNarration.ts";

test("uses the shared chunked Tencent TTS strategy for question narration", () => {
  const calls: Array<{ text: string; lang?: string; rate?: number }> = [];
  const controller = {
    pause() {},
    resume() {},
    stop() {},
  };

  const result = startQuestionNarration(
    (text, options) => {
      calls.push({ text, ...options });
      return controller;
    },
    "问题。选项 A，答案一。",
  );

  assert.equal(result, controller);
  assert.deepEqual(calls, [
    {
      text: "问题。选项 A，答案一。",
      lang: "zh-CN",
      rate: 0.9,
    },
  ]);
});

test("provides the accessible replay action label", () => {
  assert.equal(QUESTION_REPLAY_LABEL, "重新播报当前问题和选项");
});
