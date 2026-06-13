import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildBreakTenSub, sceneForProblem } from "../../content/math/scene.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { addWithin, subWithin } from "../../content/math.ts";

// 破十法 (subtract-from-ten) storyboard: take the subtrahend out of the full ten, then add the
// remainder back to the loose ones. Used when the ones digit is too small to subtract directly.
test("buildBreakTenSub splits the minuend into ten + ones and subtracts from the ten", () => {
  for (const [a, b] of [
    [13, 5],
    [12, 8],
    [16, 9],
    [11, 4],
    [15, 7],
  ] as const) {
    const scene = buildBreakTenSub(a, b);
    assert.equal(scene.kind, "break-ten-sub");
    assert.equal(scene.answer, a - b);
    assert.equal(scene.ones, a - 10, `ones for ${a}-${b}`);
    assert.equal(scene.fromTen, 10 - b, `what's left of the ten for ${a}-${b}`);
    // The two leftover groups rebuild the answer.
    assert.equal(scene.fromTen + scene.ones, a - b, `${scene.fromTen}+${scene.ones}`);
    // 破十法 only makes sense when the ones digit can't cover the subtrahend.
    assert.ok(scene.ones < b, `${a}-${b} should require borrowing`);
  }
});

test("buildBreakTenSub lays out the five narrated beats in order", () => {
  const scene = buildBreakTenSub(13, 5);
  assert.deepEqual(
    scene.steps.map((s) => s.id),
    ["show", "borrow", "subtract", "combine", "answer"],
  );
  for (const step of scene.steps) {
    assert.ok(step.caption.length > 0, `caption for ${step.id} must be non-empty`);
  }
});

// The dispatcher decides which problems get a ten-frame animation (and which fall back).
test("sceneForProblem builds a make-ten scene only for additions that cross ten", () => {
  let crossing = 0;
  let flat = 0;
  for (let i = 0; i < 200; i++) {
    const p = addWithin("G1", 20, 6);
    if (p.kind !== "arithmetic") continue;
    const [a, b] = p.operands;
    const scene = sceneForProblem(p);
    if (a < 10 && b < 10 && a + b > 10) {
      assert.ok(scene && scene.kind === "make-ten-add", `expected make-ten for ${a}+${b}`);
      crossing++;
    } else if (scene) {
      // any scene produced must at least compute the right answer
      assert.equal(scene.answer, a + b);
    } else {
      flat++;
    }
  }
  assert.ok(crossing > 0, "should have seen crossing-ten additions");
  assert.ok(flat > 0, "should have seen non-crossing additions that fall back");
});

test("sceneForProblem builds a break-ten scene only for subtractions that borrow", () => {
  for (let i = 0; i < 200; i++) {
    const p = subWithin("G1", 20, 6);
    if (p.kind !== "arithmetic") continue;
    const [a, b] = p.operands;
    const scene = sceneForProblem(p);
    if (a > 10 && a <= 18 && b < 10 && a - 10 < b && a - b >= 1) {
      assert.ok(scene && scene.kind === "break-ten-sub", `expected break-ten for ${a}-${b}`);
      assert.equal(scene.answer, a - b);
    } else if (scene) {
      assert.equal(scene.kind, "break-ten-sub");
    }
  }
});
