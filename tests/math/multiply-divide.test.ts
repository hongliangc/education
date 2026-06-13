import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { divideFact, multiplyFact } from "../../content/math.ts";

// Focused single-skill generators backing the G3 乘法/除法 lessons (within the 1-9 tables).
test("multiplyFact yields a × fact with factors 1-9 and the correct product", () => {
  for (let i = 0; i < 60; i++) {
    const p = multiplyFact("G3");
    assert.equal(p.kind, "arithmetic");
    if (p.kind !== "arithmetic") continue;
    assert.equal(p.op, "×");
    assert.equal(p.grade, "G3");
    const [a, b] = p.operands;
    assert.ok(a >= 1 && a <= 9 && b >= 1 && b <= 9, `factors out of 1-9: ${a},${b}`);
    assert.equal(Number(p.answer), a * b);
    assert.ok(p.choices.includes(p.answer), "answer must be a choice");
  }
});

test("divideFact yields an exact ÷ fact with divisor 1-9 and an integer quotient", () => {
  for (let i = 0; i < 60; i++) {
    const p = divideFact("G3");
    assert.equal(p.kind, "arithmetic");
    if (p.kind !== "arithmetic") continue;
    assert.equal(p.op, "÷");
    const [a, b] = p.operands;
    assert.equal(a % b, 0, `division must be exact: ${a}÷${b}`);
    assert.ok(b >= 1 && b <= 9, `divisor out of 1-9: ${b}`);
    const q = Number(p.answer);
    assert.equal(q, a / b);
    assert.ok(q >= 1 && q <= 9, `quotient out of 1-9: ${q}`);
  }
});
