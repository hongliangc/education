import type { ArithmeticProblem, MathProblem } from "../../../content/math";

const DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

export function toChineseNumber(value: number): string {
  if (value < 10) return DIGITS[value] ?? String(value);
  if (value === 100) return "一百";
  if (value > 100) return String(value);

  const tens = Math.floor(value / 10);
  const ones = value % 10;
  const prefix = tens === 1 ? "十" : `${DIGITS[tens]}十`;
  return ones === 0 ? prefix : `${prefix}${DIGITS[ones]}`;
}

function toCount(value: number): string {
  return value === 2 ? "两" : toChineseNumber(value);
}

// Small +/- (both operands within ten) gets the counting animation; larger sums use the
// column walkthrough. Multiplication and division always use the array/grouping animation.
function isSmallArithmetic(problem: ArithmeticProblem): boolean {
  return Math.max(problem.operands[0], problem.operands[1]) <= 10;
}

export function getGuideStepCount(problem: MathProblem): number {
  if (problem.kind !== "arithmetic") return 2;

  const [left, right] = problem.operands;
  if (problem.op === "×") return Math.max(1, left);
  if (problem.op === "÷") return Math.max(1, right);
  if (!isSmallArithmetic(problem)) return 3;
  return problem.op === "+" ? Math.max(1, Number(problem.answer)) : Math.max(1, right);
}

function arithmeticGuide(problem: ArithmeticProblem): string {
  const [left, right] = problem.operands;
  const answerNumber = Number(problem.answer);
  const answer = toChineseNumber(answerNumber);
  const small = isSmallArithmetic(problem);

  if (problem.op === "+" && small) {
    const count = Array.from({ length: answerNumber }, (_, index) =>
      toChineseNumber(index + 1),
    ).join("、");
    return `${toCount(left)}个，再加${toCount(right)}个，一起数：${count}，等于${answer}。`;
  }

  if (problem.op === "-" && small) {
    return `${toCount(left)}个，划掉${toCount(right)}个，还剩${answer}个，所以等于${answer}。`;
  }

  if (problem.op === "+") {
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
    }，等于${toChineseNumber(Math.floor(answerNumber / 10))}`;
    return `先算个位，${onesText}。再算十位，${tensText}。所以答案是${answer}。`;
  }

  if (problem.op === "-") {
    const leftOnes = left % 10;
    const rightOnes = right % 10;
    const borrow = leftOnes < rightOnes;
    const onesValue = (borrow ? leftOnes + 10 : leftOnes) - rightOnes;
    const onesText = borrow
      ? `${toChineseNumber(leftOnes)}不够减${toChineseNumber(rightOnes)}，向十位借一，${toChineseNumber(leftOnes + 10)}减${toChineseNumber(rightOnes)}等于${toChineseNumber(onesValue)}`
      : `${toChineseNumber(leftOnes)}减${toChineseNumber(rightOnes)}等于${toChineseNumber(onesValue)}`;
    const leftTens = Math.floor(left / 10) - (borrow ? 1 : 0);
    const tensText = borrow
      ? `十位剩${toChineseNumber(leftTens)}，${toChineseNumber(leftTens)}减${toChineseNumber(Math.floor(right / 10))}等于${toChineseNumber(Math.floor(answerNumber / 10))}`
      : `${toChineseNumber(leftTens)}减${toChineseNumber(Math.floor(right / 10))}等于${toChineseNumber(Math.floor(answerNumber / 10))}`;
    return `先算个位，${onesText}。${tensText}。所以答案是${answer}。`;
  }

  if (problem.op === "×") {
    return `${toCount(left)}行，每行${toCount(right)}个，一共${answer}个，所以等于${answer}。`;
  }

  return `${toCount(left)}个平均分成${toCount(right)}组，每组${answer}个，所以等于${answer}。`;
}

export function buildGuideText(problem: MathProblem): string {
  switch (problem.kind) {
    case "arithmetic":
      return arithmeticGuide(problem);
    case "comparison":
      if (problem.left > problem.right) return `${problem.left} 比 ${problem.right} 大，要填大于号 >。`;
      if (problem.left < problem.right) return `${problem.left} 比 ${problem.right} 小，要填小于号 <。`;
      return `${problem.left} 和 ${problem.right} 一样大，要填等号 =。`;
    case "shape":
      return "看清楚形状的样子，选出名字对应的图形就对啦。";
    case "time": {
      const minuteText =
        problem.minute === 0 ? "整" : problem.minute === 30 ? "半" : `${problem.minute}分`;
      return `短针指着${problem.hour}，就是${problem.hour}点${minuteText}，所以是 ${problem.answer}。`;
    }
    case "fraction":
      return `把一个整体平均分成${toChineseNumber(problem.denominator)}份，涂了${toChineseNumber(problem.numerator)}份，就是${toChineseNumber(problem.denominator)}分之${toChineseNumber(problem.numerator)}，写作 ${problem.answer}。`;
    case "measurement":
      return problem.bars
        ? `把它们的长短比一比，${problem.answer}最长。`
        : `1 米等于 100 厘米，数一数有几个 100，所以答案是 ${problem.answer} 厘米。`;
    case "word": {
      const verb = problem.op === "+" ? "加" : problem.op === "-" ? "减" : "乘";
      return `把题目里的数${verb}起来：${problem.operands[0]} ${problem.op} ${problem.operands[1]}，等于 ${problem.answer}。`;
    }
  }
}
