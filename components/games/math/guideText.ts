import type { MathProblem } from "../../../content/math";

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function toChineseNumber(value: number): string {
  if (value < 10) return DIGITS[value] ?? String(value);
  if (value === 100) return "一百";

  const tens = Math.floor(value / 10);
  const ones = value % 10;
  const prefix = tens === 1 ? "十" : `${DIGITS[tens]}十`;
  return ones === 0 ? prefix : `${prefix}${DIGITS[ones]}`;
}

function toCount(value: number): string {
  return value === 2 ? "两" : toChineseNumber(value);
}

export function getGuideStepCount(problem: MathProblem): number {
  if (problem.tier === "BASIC") {
    return problem.op === "+" ? Math.max(1, problem.answer) : Math.max(1, problem.operands[1]);
  }
  if (problem.tier === "ADVANCED") {
    return Math.max(1, problem.op === "×" ? problem.operands[0] : problem.operands[1]);
  }
  return 3;
}

export function buildGuideText(problem: MathProblem): string {
  const [left, right] = problem.operands;
  const answer = toChineseNumber(problem.answer);

  if (problem.tier === "BASIC" && problem.op === "+") {
    const count = Array.from({ length: problem.answer }, (_, index) =>
      toChineseNumber(index + 1),
    ).join("、");
    return `${toCount(left)}个，再加${toCount(right)}个，一起数：${count}，等于${answer}。`;
  }

  if (problem.tier === "BASIC" && problem.op === "-") {
    return `${toCount(left)}个，划掉${toCount(right)}个，还剩${answer}个，所以等于${answer}。`;
  }

  if (problem.tier === "MID" && problem.op === "+") {
    const leftOnes = left % 10;
    const rightOnes = right % 10;
    const onesTotal = leftOnes + rightOnes;
    const carry = onesTotal >= 10 ? 1 : 0;
    const onesText =
      carry === 1
        ? `${toChineseNumber(leftOnes)}加${toChineseNumber(rightOnes)}等于${toChineseNumber(onesTotal)}，写${toChineseNumber(onesTotal % 10)}进一`
        : `${toChineseNumber(leftOnes)}加${toChineseNumber(rightOnes)}等于${toChineseNumber(onesTotal)}`;
    const tensText = `${toChineseNumber(Math.floor(left / 10))}加${toChineseNumber(Math.floor(right / 10))}${
      carry ? "再加进位一" : ""
    }，等于${toChineseNumber(Math.floor(problem.answer / 10))}`;
    return `先算个位，${onesText}。再算十位，${tensText}。所以答案是${answer}。`;
  }

  if (problem.tier === "MID" && problem.op === "-") {
    const leftOnes = left % 10;
    const rightOnes = right % 10;
    const borrow = leftOnes < rightOnes;
    const onesValue = (borrow ? leftOnes + 10 : leftOnes) - rightOnes;
    const onesText = borrow
      ? `${toChineseNumber(leftOnes)}不够减${toChineseNumber(rightOnes)}，向十位借一，${toChineseNumber(leftOnes + 10)}减${toChineseNumber(rightOnes)}等于${toChineseNumber(onesValue)}`
      : `${toChineseNumber(leftOnes)}减${toChineseNumber(rightOnes)}等于${toChineseNumber(onesValue)}`;
    const leftTens = Math.floor(left / 10) - (borrow ? 1 : 0);
    const tensText = borrow
      ? `十位剩${toChineseNumber(leftTens)}，${toChineseNumber(leftTens)}减${toChineseNumber(Math.floor(right / 10))}等于${toChineseNumber(Math.floor(problem.answer / 10))}`
      : `${toChineseNumber(leftTens)}减${toChineseNumber(Math.floor(right / 10))}等于${toChineseNumber(Math.floor(problem.answer / 10))}`;
    return `先算个位，${onesText}。${tensText}。所以答案是${answer}。`;
  }

  if (problem.op === "×") {
    return `${toCount(left)}行，每行${toCount(right)}个，一共${answer}个，所以等于${answer}。`;
  }

  return `${toCount(left)}个平均分成${toCount(right)}组，每组${answer}个，所以等于${answer}。`;
}
