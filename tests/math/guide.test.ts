import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildGuideText, getGuideStepCount } from "../../components/games/math/guideText.ts";
import type { MathProblem } from "../../content/math";

const cases: Array<[MathProblem, string]> = [
  [
    { question: "3 + 2", answer: 5, op: "+", operands: [3, 2], tier: "BASIC" },
    "三个，再加两个，一起数：一、二、三、四、五，等于五。",
  ],
  [
    { question: "5 - 2", answer: 3, op: "-", operands: [5, 2], tier: "BASIC" },
    "五个，划掉两个，还剩三个，所以等于三。",
  ],
  [
    { question: "23 + 18", answer: 41, op: "+", operands: [23, 18], tier: "MID" },
    "先算个位，三加八等于十一，写一进一。再算十位，二加一再加进位一，等于四。所以答案是四十一。",
  ],
  [
    { question: "42 - 17", answer: 25, op: "-", operands: [42, 17], tier: "MID" },
    "先算个位，二不够减七，向十位借一，十二减七等于五。十位剩三，三减一等于二。所以答案是二十五。",
  ],
  [
    { question: "2 × 3", answer: 6, op: "×", operands: [2, 3], tier: "ADVANCED" },
    "两行，每行三个，一共六个，所以等于六。",
  ],
  [
    { question: "6 ÷ 2", answer: 3, op: "÷", operands: [6, 2], tier: "ADVANCED" },
    "六个平均分成两组，每组三个，所以等于三。",
  ],
];

for (const [problem, expected] of cases) {
  test(`builds child-friendly guidance for ${problem.question}`, () => {
    assert.equal(buildGuideText(problem), expected);
  });
}

test("uses enough animation steps to reveal every counted item or group", () => {
  assert.equal(getGuideStepCount(cases[0]![0]), 5);
  assert.equal(getGuideStepCount(cases[1]![0]), 2);
  assert.equal(getGuideStepCount(cases[2]![0]), 3);
  assert.equal(getGuideStepCount(cases[4]![0]), 2);
  assert.equal(getGuideStepCount(cases[5]![0]), 2);
});
