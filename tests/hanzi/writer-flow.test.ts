import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { runDemoThenPractice } from "../../components/games/hanzi/writerFlow.ts";

test("demo flow only animates the top demo layer without starting quiz hints", async () => {
  const calls: string[] = [];
  const writer = {
    cancelQuiz: () => {
      calls.push("cancelQuiz");
    },
    animateCharacter: async () => {
      calls.push("animateCharacter");
    },
    hideCharacter: async () => {
      calls.push("hideCharacter");
    },
    hideOutline: async () => {
      calls.push("hideOutline");
    },
  };

  await runDemoThenPractice(writer);

  assert.deepEqual(calls, ["cancelQuiz", "animateCharacter", "hideCharacter"]);
});
