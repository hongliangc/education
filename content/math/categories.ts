import {
  borrowSubWithin,
  crossingAddWithin,
  tableDivide,
  tableMultiply,
  tenBondAddWithin,
  tenBondSubWithin,
  type MathProblem,
  // @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
} from "../math.ts";
import type { MathLesson } from "./curriculum";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { sceneForProblem, type Storyboard } from "./scene.ts";
import type { MathMistake } from "../../lib/math/mistakes";

export interface MathCategory extends MathLesson {
  sceneKinds: Storyboard["kind"][];
}

function repeat(make: () => MathProblem, n: number): MathProblem[] {
  return Array.from({ length: Math.max(0, n) }, make);
}

function mixed(
  left: () => MathProblem,
  right: () => MathProblem,
  n: number,
): MathProblem[] {
  return repeat(() => (Math.random() < 0.5 ? left() : right()), n);
}

export const MATH_CATEGORIES: MathCategory[] = [
  {
    key: "within-10",
    order: 1,
    title: "10以内加减法",
    icon: "🔟",
    concept: "把一个数分成两部分，再合起来或拿走一部分，就能轻松算出答案。",
    sceneKinds: ["ten-bond"],
    generate: (n) =>
      mixed(
        () => tenBondAddWithin("K2", 10, 4),
        () => tenBondSubWithin("K2", 10, 4),
        n,
      ),
  },
  {
    key: "within-20",
    order: 2,
    title: "20以内进退位",
    icon: "➕➖",
    concept: "加法先凑成 10，减法不够减就把 10 拆开，算起来又快又清楚。",
    sceneKinds: ["make-ten-add", "break-ten-sub"],
    generate: (n) =>
      mixed(
        () => crossingAddWithin("G1", 6),
        () => borrowSubWithin("G1", 6),
        n,
      ),
  },
  {
    key: "table-mul",
    order: 3,
    title: "表内乘法",
    icon: "✖️",
    concept: "把小圆点排成几行，每行一样多，一行一行跳着数就是乘法。",
    sceneKinds: ["array-mul"],
    generate: (n) => repeat(() => tableMultiply("G2"), n),
  },
  {
    key: "table-div",
    order: 4,
    title: "表内除法",
    icon: "➗",
    concept: "把总数平均分进几个篮子，每个篮子一样多，就是除法的答案。",
    sceneKinds: ["share-div"],
    generate: (n) => repeat(() => tableDivide("G3"), n),
  },
];

export function categoryMatches(category: MathCategory, problem: MathProblem): boolean {
  const kind = sceneForProblem(problem)?.kind;
  return kind !== undefined && kind !== null && category.sceneKinds.includes(kind);
}

export function mistakesForCategory(
  category: MathCategory,
  mistakes: MathMistake[],
): MathMistake[] {
  return mistakes.filter((mistake) => categoryMatches(category, mistake));
}
