import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildGuideText, getGuideStepCount } from "../../components/games/math/guideText.ts";
import type { ArithmeticProblem } from "../../content/math.ts";

function arithmetic(
  prompt: string,
  op: ArithmeticProblem["op"],
  operands: [number, number],
  answer: number,
  grade: ArithmeticProblem["grade"],
): ArithmeticProblem {
  return {
    kind: "arithmetic",
    id: `${grade}:arithmetic:${prompt}`,
    grade,
    op,
    operands,
    prompt,
    answer: String(answer),
    choices: [String(answer)],
  };
}

const cases: Array<[ArithmeticProblem, string]> = [
  [
    arithmetic("3 + 2", "+", [3, 2], 5, "K1"),
    "三个，再加两个，一起数：一、二、三、四、五，等于五。",
  ],
  [
    arithmetic("5 - 2", "-", [5, 2], 3, "K3"),
    "五个，划掉两个，还剩三个，所以等于三。",
  ],
  [
    arithmetic("23 + 18", "+", [23, 18], 41, "G2"),
    "先算个位，三加八等于十一，写一进一。再算十位，二加一再加进位一，等于四。所以答案是四十一。",
  ],
  [
    arithmetic("42 - 17", "-", [42, 17], 25, "G2"),
    "先算个位，二不够减七，向十位借一，十二减七等于五。十位剩三，三减一等于二。所以答案是二十五。",
  ],
  [
    arithmetic("2 × 3", "×", [2, 3], 6, "G2"),
    "两行，每行三个，一共六个，所以等于六。",
  ],
  [
    arithmetic("6 ÷ 2", "÷", [6, 2], 3, "G2"),
    "六个平均分成两组，每组三个，所以等于三。",
  ],
];

for (const [problem, expected] of cases) {
  test(`builds child-friendly guidance for ${problem.prompt}`, () => {
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

test("explains comparison and fraction problems in child-friendly language", () => {
  assert.equal(
    buildGuideText({
      kind: "comparison",
      id: "K1:comparison:3 ◯ 5",
      grade: "K1",
      left: 3,
      right: 5,
      prompt: "3 ◯ 5",
      answer: "<",
      choices: [">", "<", "="],
    }),
    "3 比 5 小，要填小于号 <。",
  );
  assert.equal(
    buildGuideText({
      kind: "fraction",
      id: "G3:fraction:1/2",
      grade: "G3",
      numerator: 1,
      denominator: 2,
      prompt: "涂色部分是几分之几?",
      answer: "1/2",
      choices: ["1/2"],
    }),
    "把一个整体平均分成二份，涂了一份，就是二分之一，写作 1/2。",
  );
});
