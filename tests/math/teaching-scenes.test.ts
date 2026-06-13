import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildTenBondAdd, buildTenBondSub, buildArrayMul, buildShareDiv } from "../../content/math/scene.ts";

// 数的组成 (number bond) over a ten-frame: the two parts fill the frame and a part-whole bond
// makes the relationship explicit. Used for within-10 addition/subtraction.
test("buildTenBondAdd composes the whole from its two parts", () => {
  for (const [a, b] of [
    [5, 3],
    [4, 4],
    [6, 1],
    [2, 7],
    [9, 1],
  ] as const) {
    const s = buildTenBondAdd(a, b);
    assert.equal(s.kind, "ten-bond");
    assert.equal(s.op, "+");
    assert.equal(s.whole, a + b, `whole for ${a}+${b}`);
    assert.equal(s.answer, a + b);
    assert.deepEqual(s.parts, [a, b]);
    assert.equal(s.parts[0] + s.parts[1], s.whole);
    assert.ok(s.whole <= 10, `${a}+${b} must fit one ten-frame`);
  }
});

test("buildTenBondAdd lays out the five narrated beats in order", () => {
  const s = buildTenBondAdd(5, 3);
  assert.deepEqual(
    s.steps.map((x) => x.id),
    ["show", "part-a", "part-b", "bond", "answer"],
  );
  for (const step of s.steps) assert.ok(step.caption.length > 0, `caption for ${step.id}`);
});

test("buildTenBondSub splits the whole into the removed part and what is left", () => {
  for (const [a, b] of [
    [8, 3],
    [10, 4],
    [7, 2],
    [9, 5],
    [6, 1],
  ] as const) {
    const s = buildTenBondSub(a, b);
    assert.equal(s.kind, "ten-bond");
    assert.equal(s.op, "-");
    assert.equal(s.whole, a, `whole for ${a}-${b}`);
    assert.equal(s.answer, a - b);
    // parts = [what's left, what was removed]; together they rebuild the whole.
    assert.deepEqual(s.parts, [a - b, b]);
    assert.equal(s.parts[0] + s.parts[1], s.whole);
    assert.ok(a <= 10, `${a}-${b} must fit one ten-frame`);
  }
});

test("buildTenBondSub lays out the five narrated beats in order", () => {
  const s = buildTenBondSub(8, 3);
  assert.deepEqual(
    s.steps.map((x) => x.id),
    ["show", "whole", "remove", "bond", "answer"],
  );
});

// 阵列 + 跳数 (array + skip-count): a rows of b dots; the running totals are the skip-count.
test("buildArrayMul builds an a×b array with per-row skip counts", () => {
  for (const [a, b] of [
    [3, 4],
    [2, 6],
    [9, 9],
    [1, 7],
    [5, 5],
  ] as const) {
    const s = buildArrayMul(a, b);
    assert.equal(s.kind, "array-mul");
    assert.equal(s.rows, a);
    assert.equal(s.cols, b);
    assert.equal(s.product, a * b, `product for ${a}×${b}`);
    assert.equal(s.answer, a * b);
    assert.equal(s.skipCounts.length, a, `one running total per row for ${a}×${b}`);
    s.skipCounts.forEach((t, i) => assert.equal(t, (i + 1) * b, `skip count ${i} for ${a}×${b}`));
    assert.equal(s.skipCounts[s.skipCounts.length - 1], a * b);
  }
});

test("buildArrayMul walks one beat per row between show and answer", () => {
  for (const [a, b] of [
    [3, 4],
    [9, 9],
    [1, 7],
    [5, 2],
  ] as const) {
    const ids = buildArrayMul(a, b).steps.map((x) => x.id);
    assert.equal(ids[0], "show", `first beat for ${a}×${b}`);
    assert.equal(ids[ids.length - 1], "answer", `last beat for ${a}×${b}`);
    const rowBeats = ids.slice(1, -1);
    assert.equal(rowBeats.length, a, `one beat per row for ${a}×${b}`);
    assert.ok(rowBeats.every((id) => id === "row"), `middle beats are rows for ${a}×${b}`);
  }
});

// 平均分 (equal sharing): deal `a` counters one at a time into `b` baskets; each holds the quotient.
test("buildShareDiv shares the total equally across the baskets", () => {
  for (const [a, b] of [
    [12, 3],
    [10, 5],
    [81, 9],
    [6, 2],
    [8, 4],
  ] as const) {
    const s = buildShareDiv(a, b);
    assert.equal(s.kind, "share-div");
    assert.equal(s.total, a);
    assert.equal(s.baskets, b);
    assert.equal(s.per, a / b, `per basket for ${a}÷${b}`);
    assert.equal(s.answer, a / b);
    assert.equal(s.per * s.baskets, s.total, `${a}÷${b} must divide evenly`);
  }
});

test("buildShareDiv deals one round per quotient unit between show and answer", () => {
  for (const [a, b] of [
    [12, 3],
    [8, 4],
    [81, 9],
    [10, 5],
  ] as const) {
    const ids = buildShareDiv(a, b).steps.map((x) => x.id);
    assert.equal(ids[0], "show", `first beat for ${a}÷${b}`);
    assert.equal(ids[ids.length - 1], "answer", `last beat for ${a}÷${b}`);
    const rounds = ids.slice(1, -1);
    assert.equal(rounds.length, a / b, `one round per unit for ${a}÷${b}`);
    assert.ok(rounds.every((id) => id === "round"), `middle beats are rounds for ${a}÷${b}`);
  }
});
