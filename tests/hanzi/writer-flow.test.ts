import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { runDemoThenPractice } from "../../components/games/hanzi/writerFlow.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { applyStrokeStyle } from "../../components/games/hanzi/writingCanvas.ts";

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

test("writing uses a child-friendly ten-pixel brush", () => {
  const context = {
    lineWidth: 0,
    lineCap: "butt",
    lineJoin: "miter",
    strokeStyle: "",
  } as unknown as CanvasRenderingContext2D;

  applyStrokeStyle(context);

  assert.equal(context.lineWidth, 10);
});
