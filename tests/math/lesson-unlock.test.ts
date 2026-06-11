import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { isLessonUnlocked } from "../../lib/lessonProgress.ts";

const keys = ["a", "b", "c"];

test("the first lesson is always unlocked", () => {
  assert.equal(isLessonUnlocked(keys, {}, 0), true);
});

test("a later lesson stays locked until the previous one is completed", () => {
  assert.equal(isLessonUnlocked(keys, {}, 1), false);
  assert.equal(isLessonUnlocked(keys, { a: { stars: 2, completed: false } }, 1), false);
  assert.equal(isLessonUnlocked(keys, { a: { stars: 3, completed: true } }, 1), true);
});

test("completion only unlocks the immediately following lesson", () => {
  const progress = { a: { stars: 3, completed: true } };
  assert.equal(isLessonUnlocked(keys, progress, 2), false); // c still needs b
  const withB = { ...progress, b: { stars: 3, completed: true } };
  assert.equal(isLessonUnlocked(keys, withB, 2), true);
});
