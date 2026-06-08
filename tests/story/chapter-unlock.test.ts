import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { chapterUnlockState } from "../../lib/rewards/client.ts";

test("the first chapter is free", () => {
  const state = chapterUnlockState({ unlocked: false, available: true, starsCost: 0 }, 0);
  assert.equal(state.kind, "free");
  assert.equal(state.label, "免费");
  assert.equal(state.canRedeem, true);
  assert.equal(state.canOpen, false);
});

test("a chapter is locked until the previous one is unlocked", () => {
  const state = chapterUnlockState({ unlocked: false, available: false, starsCost: 5 }, 100);
  assert.equal(state.kind, "locked");
  assert.equal(state.label, "先解锁上一章");
  assert.equal(state.canOpen, false);
  assert.equal(state.canRedeem, false);
});

test("an affordable chapter shows its (family-adjusted) star cost", () => {
  const state = chapterUnlockState({ unlocked: false, available: true, starsCost: 8 }, 10);
  assert.equal(state.kind, "affordable");
  assert.equal(state.label, "⭐8");
  assert.equal(state.canRedeem, true);
});

test("insufficient balance blocks redemption", () => {
  const state = chapterUnlockState({ unlocked: false, available: true, starsCost: 8 }, 3);
  assert.equal(state.kind, "insufficient");
  assert.equal(state.canRedeem, false);
  assert.equal(state.canOpen, false);
});

test("completed historical chapters read as already unlocked", () => {
  const state = chapterUnlockState({ unlocked: true, available: true, starsCost: 5 }, 0);
  assert.equal(state.kind, "unlocked");
  assert.equal(state.canOpen, true);
});
