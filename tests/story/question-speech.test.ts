import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { questionSpeechText } from "../../components/games/story/questionSpeech.ts";

test("reads the question followed by every labeled choice", () => {
  assert.equal(
    questionSpeechText({
      q: "乌龟为什么最后赢了？",
      choices: ["跑得比兔子快", "坚持不停往前爬", "走了近路"],
      answer: 1,
      explain: "乌龟坚持到底，所以赢了。",
    }),
    "乌龟为什么最后赢了？选项 A，跑得比兔子快。选项 B，坚持不停往前爬。选项 C，走了近路。",
  );
});
