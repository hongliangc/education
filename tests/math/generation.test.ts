import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateChoices, generateRound } from "../../content/math.ts";

test("basic rounds stay within ten and subtraction never goes negative", () => {
  for (let index = 0; index < 40; index++) {
    const problems = generateRound("BASIC", 8);

    assert.equal(problems.length, 8);
    for (const problem of problems) {
      assert.equal(problem.tier, "BASIC");
      assert.ok(problem.op === "+" || problem.op === "-");
      assert.ok(problem.operands.every((operand) => operand >= 0 && operand <= 10));
      assert.ok(problem.answer >= 0 && problem.answer <= 10);
    }
  }
});

test("mid rounds include two-digit carrying and borrowing problems", () => {
  for (let index = 0; index < 20; index++) {
    const problems = generateRound("MID", 5);

    assert.equal(problems.length, 5);
    assert.ok(problems.some(({ operands }) => operands.some((operand) => operand >= 10)));
    assert.ok(
      problems.some(
        ({ op, operands: [left, right] }) =>
          (op === "+" && left % 10 + (right % 10) >= 10) ||
          (op === "-" && left % 10 < right % 10),
      ),
    );
    for (const problem of problems) {
      assert.equal(problem.tier, "MID");
      assert.ok(problem.answer >= 0 && problem.answer <= 100);
    }
  }
});

test("advanced rounds use multiplication facts and exact division", () => {
  for (let index = 0; index < 40; index++) {
    const problems = generateRound("ADVANCED", 8);

    assert.equal(problems.length, 8);
    for (const problem of problems) {
      const [left, right] = problem.operands;
      assert.equal(problem.tier, "ADVANCED");
      assert.ok(problem.op === "×" || problem.op === "÷");
      if (problem.op === "×") {
        assert.ok(left >= 1 && left <= 9);
        assert.ok(right >= 1 && right <= 9);
        assert.equal(problem.answer, left * right);
      } else {
        assert.ok(left <= 81);
        assert.ok(right >= 1 && right <= 9);
        assert.equal(left % right, 0);
        assert.ok(problem.answer >= 1 && problem.answer <= 9);
      }
    }
  }
});

test("choices contain the answer exactly once and remain non-negative", () => {
  for (const tier of ["BASIC", "MID", "ADVANCED"] as const) {
    for (const answer of [0, 1, 5, 10, 42, 81]) {
      const choices = generateChoices(answer, tier);

      assert.equal(choices.length, 4);
      assert.equal(new Set(choices).size, 4);
      assert.equal(choices.filter((choice) => choice === answer).length, 1);
      assert.ok(choices.every((choice) => choice >= 0));
    }
  }
});
