import type { Grade } from "@/lib/grades";
import type { MathProblem } from "../math";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { addWithin, comparison, shapeProblem, subWithin, timeProblem } from "../math.ts";

// One knowledge-point lesson on a grade's guided path: a concept to teach, then focused
// practice generated for just this skill (reusing the module's existing problem generators).
export interface MathLesson {
  key: string;
  order: number;
  title: string;
  icon: string;
  concept: string; // 引入阶段精灵讲解的一句话
  generate: (n: number) => MathProblem[];
}

function repeat(make: () => MathProblem, n: number): MathProblem[] {
  return Array.from({ length: Math.max(0, n) }, make);
}

// G1 path: arithmetic within 20 (carry/borrow), comparison, clock, plane shapes — by 由浅入深.
const G1_LESSONS: MathLesson[] = [
  {
    key: "g1-add-within-20",
    order: 1,
    title: "20以内加法",
    icon: "➕",
    concept: "先把一个数凑成 10，再加上剩下的，又快又准！",
    generate: (n) => repeat(() => addWithin("G1", 20, 6), n),
  },
  {
    key: "g1-sub-within-20",
    order: 2,
    title: "20以内减法",
    icon: "➖",
    concept: "个位不够减的时候，向十位借一个 10 再减就好啦。",
    generate: (n) => repeat(() => subWithin("G1", 20, 6), n),
  },
  {
    key: "g1-compare-100",
    order: 3,
    title: "100以内比大小",
    icon: "⚖️",
    concept: "先比十位，十位一样大，再比个位。",
    generate: (n) => repeat(() => comparison("G1", 100), n),
  },
  {
    key: "g1-clock",
    order: 4,
    title: "认识钟表",
    icon: "🕐",
    concept: "短针指着几就是几点，长针指 12 是整点、指 6 是半点。",
    generate: (n) => repeat(() => timeProblem("G1"), n),
  },
  {
    key: "g1-shapes",
    order: 5,
    title: "平面图形",
    icon: "🔺",
    concept: "看清楚边和角，就能认出三角形、正方形和圆形。",
    generate: (n) => repeat(() => shapeProblem("G1"), n),
  },
];

const CURRICULUM: Partial<Record<Grade, MathLesson[]>> = {
  G1: G1_LESSONS,
};

// The ordered lesson path for a grade, or null when that grade has no guided curriculum yet
// (callers fall back to the classic mixed practice round).
export function getMathCurriculum(grade: Grade): MathLesson[] | null {
  return CURRICULUM[grade] ?? null;
}
