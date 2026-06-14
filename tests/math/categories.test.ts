import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { tableDivide, tableMultiply } from "../../content/math.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { MATH_CATEGORIES, categoryMatches, mistakesForCategory } from "../../content/math/categories.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { sceneForProblem } from "../../content/math/scene.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { toMistake } from "../../lib/math/mistakes.ts";

test("every category only generates problems supported by its teaching scenes", () => {
  for (const category of MATH_CATEGORIES) {
    for (let sample = 0; sample < 200; sample++) {
      const problems = category.generate(5);
      assert.equal(problems.length, 5, `${category.key} should generate five problems`);
      for (const problem of problems) {
        const kind = sceneForProblem(problem)?.kind;
        assert.ok(kind, `${category.key} generated an unanimated problem: ${problem.prompt}`);
        assert.ok(
          category.sceneKinds.includes(kind),
          `${category.key} generated ${kind}: ${problem.prompt}`,
        );
        assert.equal(categoryMatches(category, problem), true);
      }
    }
  }
});

test("category matching keeps the four arithmetic bands mutually exclusive", () => {
  for (const source of MATH_CATEGORIES) {
    const problems = source.generate(40);
    for (const problem of problems) {
      for (const candidate of MATH_CATEGORIES) {
        assert.equal(
          categoryMatches(candidate, problem),
          candidate.key === source.key,
          `${problem.prompt} from ${source.key} matched ${candidate.key}`,
        );
      }
    }
  }
});

test("tableMultiply generates animated multiplication facts with factors 2-9", () => {
  for (let sample = 0; sample < 200; sample++) {
    const problem = tableMultiply("G3");
    assert.equal(problem.op, "×");
    const [a, b] = problem.operands;
    assert.ok(a >= 2 && a <= 9, `first factor out of range: ${a}`);
    assert.ok(b >= 2 && b <= 9, `second factor out of range: ${b}`);
    assert.equal(Number(problem.answer), a * b);
    assert.equal(sceneForProblem(problem)?.kind, "array-mul");
  }
});

test("tableDivide generates animated exact division facts with factors 2-9", () => {
  for (let sample = 0; sample < 200; sample++) {
    const problem = tableDivide("G3");
    assert.equal(problem.op, "÷");
    const [dividend, divisor] = problem.operands;
    const quotient = Number(problem.answer);
    assert.equal(dividend % divisor, 0);
    assert.ok(divisor >= 2 && divisor <= 9, `divisor out of range: ${divisor}`);
    assert.ok(quotient >= 2 && quotient <= 9, `quotient out of range: ${quotient}`);
    assert.equal(quotient, dividend / divisor);
    assert.equal(sceneForProblem(problem)?.kind, "share-div");
  }
});

test("mistakesForCategory only returns mistakes whose teaching scene matches", () => {
  const mistakes = MATH_CATEGORIES.flatMap((category, categoryIndex) =>
    category.generate(2).map((problem, problemIndex) =>
      toMistake(problem, `2026-06-14T00:0${categoryIndex}:${problemIndex}0.000Z`),
    ),
  );

  for (const category of MATH_CATEGORIES) {
    const filtered = mistakesForCategory(category, mistakes);
    assert.equal(filtered.length, 2, `${category.key} should have two matching mistakes`);
    assert.ok(filtered.every((mistake) => categoryMatches(category, mistake)));
  }
});
