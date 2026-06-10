import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateRound, type MathProblem } from "../../content/math.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADES, type Grade } from "../../lib/grades.ts";

// Programmatic generation is random, so sample many rounds and assert invariants.
function sample(grade: Grade, rounds = 60, n = 6): MathProblem[] {
  const all: MathProblem[] = [];
  for (let i = 0; i < rounds; i++) all.push(...generateRound(grade, n));
  return all;
}

test("every grade emits valid, self-consistent multiple-choice problems", () => {
  for (const grade of GRADES) {
    const problems = sample(grade);
    assert.ok(problems.length > 0, `${grade} produced no problems`);
    for (const p of problems) {
      assert.equal(p.grade, grade);
      assert.ok(p.prompt.length > 0);
      assert.ok(p.choices.length >= 3 && p.choices.length <= 4, `${grade} ${p.kind} choice count`);
      assert.equal(new Set(p.choices).size, p.choices.length, "choices must be unique");
      assert.ok(p.choices.includes(p.answer), "answer must be among the choices");
    }
  }
});

test("round length is honored and clamped at zero", () => {
  assert.equal(generateRound("K1", 0).length, 0);
  assert.equal(generateRound("G3", 7).length, 7);
});

const ADD_SUB_MAX: Record<Grade, number> = {
  K1: 5,
  K2: 10,
  K3: 10,
  G1: 20,
  G2: 100,
  G3: 10000,
};

test("addition and subtraction stay within each grade's range and compute correctly", () => {
  for (const grade of GRADES) {
    const max = ADD_SUB_MAX[grade];
    for (const p of sample(grade)) {
      if (p.kind !== "arithmetic") continue;
      if (p.op !== "+" && p.op !== "-") continue;
      const [a, b] = p.operands;
      assert.ok(a >= 0 && a <= max, `${grade} operand ${a} > ${max}`);
      assert.ok(b >= 0 && b <= max, `${grade} operand ${b} > ${max}`);
      const ans = Number(p.answer);
      assert.equal(ans, p.op === "+" ? a + b : a - b);
      assert.ok(ans >= 0 && ans <= max, `${grade} answer ${ans} out of range`);
    }
  }
});

test("kindergarten one practises counting, comparison and shapes", () => {
  const kinds = new Set(sample("K1").map((p) => p.kind));
  assert.ok(kinds.has("arithmetic"), "K1 counting modelled as small addition");
  assert.ok(kinds.has("comparison"));
  assert.ok(kinds.has("shape"));
});

test("grade one introduces clock reading", () => {
  assert.ok(sample("G1").some((p) => p.kind === "time"));
});

test("grade two uses times-table multiplication, exact division and word problems", () => {
  let sawFact = false;
  for (const p of sample("G2")) {
    if (p.kind !== "arithmetic") continue;
    if (p.op !== "×" && p.op !== "÷") continue;
    sawFact = true;
    const [a, b] = p.operands;
    if (p.op === "×") {
      assert.ok(a >= 1 && a <= 9 && b >= 1 && b <= 9, "table factors 1-9");
      assert.equal(Number(p.answer), a * b);
    } else {
      assert.equal(a % b, 0, "division must be exact");
      assert.ok(b >= 1 && b <= 9);
      assert.ok(Number(p.answer) >= 1 && Number(p.answer) <= 9);
    }
  }
  assert.ok(sawFact, "G2 should produce multiplication/division facts");
  assert.ok(sample("G2").some((p) => p.kind === "word"));
});

test("grade three adds fractions and multi-digit multiplication or division", () => {
  const g3 = sample("G3");
  assert.ok(g3.some((p) => p.kind === "fraction"));
  assert.ok(
    g3.some(
      (p) =>
        p.kind === "arithmetic" &&
        (p.op === "×" || p.op === "÷") &&
        Math.max(p.operands[0], p.operands[1]) > 9,
    ),
    "G3 should use multi-digit multiplication or division",
  );
});
