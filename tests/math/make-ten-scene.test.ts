import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildMakeTenAdd } from "../../content/math/scene.ts";

// The deterministic make-ten (凑十法) storyboard that drives the demo animation for ANY a+b.
test("buildMakeTenAdd derives need/rest/answer so a+need makes ten", () => {
  for (const [a, b] of [
    [8, 5],
    [7, 6],
    [9, 4],
    [6, 7],
    [5, 8],
  ] as const) {
    const scene = buildMakeTenAdd(a, b);
    assert.equal(scene.kind, "make-ten-add");
    assert.equal(scene.answer, a + b);
    assert.equal(scene.need, Math.min(b, 10 - a), `need for ${a}+${b}`);
    assert.equal(scene.rest, b - scene.need, `rest for ${a}+${b}`);
    assert.equal(scene.need + scene.rest, b, "the two parts must rebuild b");
    // For a sum that crosses ten the first addend is completed exactly to ten.
    assert.equal(a + scene.need, 10, `${a}+${scene.need} should make ten`);
  }
});

test("buildMakeTenAdd lays out the five narrated beats in order", () => {
  const scene = buildMakeTenAdd(8, 5);
  assert.deepEqual(
    scene.steps.map((s) => s.id),
    ["show", "split", "make-ten", "carry", "answer"],
  );
  for (const step of scene.steps) {
    assert.equal(typeof step.caption, "string");
    assert.ok(step.caption.length > 0, `caption for ${step.id} must be non-empty`);
  }
});
