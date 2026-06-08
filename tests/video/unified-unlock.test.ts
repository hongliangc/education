import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { canPlayVideo, mergeVideoUnlockState } from "../../lib/video/unlock.ts";

test("a free video plays without any unlock", () => {
  assert.equal(canPlayVideo(0, false), true);
});

test("a migrated or new unlock makes a paid video playable", () => {
  assert.equal(canPlayVideo(20, true), true);
});

test("a paid video without an unlock stays locked", () => {
  assert.equal(canPlayVideo(20, false), false);
});

test("merge marks unified-unlocked and free videos as unlocked", () => {
  const merged = mergeVideoUnlockState(
    [
      { id: "a", title: "A", order: 1, cost: 20 },
      { id: "b", title: "B", order: 2, cost: 0 },
      { id: "c", title: "C", order: 3, cost: 20 },
    ],
    new Set(["a"]),
  );
  assert.equal(merged.find((v) => v.id === "a")?.unlocked, true);
  assert.equal(merged.find((v) => v.id === "b")?.unlocked, true);
  assert.equal(merged.find((v) => v.id === "c")?.unlocked, false);
});
