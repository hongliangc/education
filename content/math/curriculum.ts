import type { Grade } from "@/lib/grades";
import type { MathProblem } from "../math";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { addWithin, compareLength, comparison, divideFact, fractionProblem, multiplyFact, shapeProblem, subWithin, timeProblem, unitConversion, wordProblem } from "../math.ts";

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

// K1 数感启蒙：5 以内加减、比多少、认图形（具体物→数一数）。
const K1_LESSONS: MathLesson[] = [
  {
    key: "k1-add-5",
    order: 1,
    title: "5以内加法",
    icon: "➕",
    concept: "把两堆合在一起，一个一个数一数，就知道一共有几个。",
    generate: (n) => repeat(() => addWithin("K1", 5, 4), n),
  },
  {
    key: "k1-sub-5",
    order: 2,
    title: "5以内减法",
    icon: "➖",
    concept: "拿走几个，再数一数剩下的，就是答案。",
    generate: (n) => repeat(() => subWithin("K1", 5, 4), n),
  },
  {
    key: "k1-compare-5",
    order: 3,
    title: "比多少",
    icon: "⚖️",
    concept: "一个对一个排好，谁有多出来的，谁就多。",
    generate: (n) => repeat(() => comparison("K1", 5), n),
  },
  {
    key: "k1-shapes",
    order: 4,
    title: "认识图形",
    icon: "🔺",
    concept: "看清楚样子，就能认出三角形、正方形和圆形。",
    generate: (n) => repeat(() => shapeProblem("K1"), n),
  },
];

// K2 十以内：凑十加法、减法、比多少、图形。
const K2_LESSONS: MathLesson[] = [
  {
    key: "k2-add-10",
    order: 1,
    title: "10以内加法",
    icon: "➕",
    concept: "先把一个数凑成 10，再数剩下的，又快又准。",
    generate: (n) => repeat(() => addWithin("K2", 10, 4), n),
  },
  {
    key: "k2-sub-10",
    order: 2,
    title: "10以内减法",
    icon: "➖",
    concept: "从总数里拿走一些，剩下的就是得数。",
    generate: (n) => repeat(() => subWithin("K2", 10, 4), n),
  },
  {
    key: "k2-compare-10",
    order: 3,
    title: "比多少",
    icon: "⚖️",
    concept: "数大的就多，数小的就少，一样大就相等。",
    generate: (n) => repeat(() => comparison("K2", 10), n),
  },
  {
    key: "k2-shapes",
    order: 4,
    title: "认识图形",
    icon: "🔺",
    concept: "数一数边和角，就能分清不同的图形。",
    generate: (n) => repeat(() => shapeProblem("K2"), n),
  },
];

// K3 熟练 + 量：十以内加减、比长短、图形。
const K3_LESSONS: MathLesson[] = [
  {
    key: "k3-add-10",
    order: 1,
    title: "10以内加法",
    icon: "➕",
    concept: "熟练地把两个数合起来，争取一眼就看出得数。",
    generate: (n) => repeat(() => addWithin("K3", 10, 4), n),
  },
  {
    key: "k3-sub-10",
    order: 2,
    title: "10以内减法",
    icon: "➖",
    concept: "想一想几加几等于它，就能很快算出减法。",
    generate: (n) => repeat(() => subWithin("K3", 10, 4), n),
  },
  {
    key: "k3-length",
    order: 3,
    title: "比长短",
    icon: "📏",
    concept: "把它们的一端对齐，伸得最长的那个就最长。",
    generate: (n) => repeat(() => compareLength("K3"), n),
  },
  {
    key: "k3-shapes",
    order: 4,
    title: "认识图形",
    icon: "🔺",
    concept: "看清边和角，认出三角形、正方形、圆形和更多图形。",
    generate: (n) => repeat(() => shapeProblem("K3"), n),
  },
];

// G2 两位数 + 乘法启蒙 + 测量：百以内加减、乘法的认识、米和厘米、解决问题。
const G2_LESSONS: MathLesson[] = [
  {
    key: "g2-add-100",
    order: 1,
    title: "100以内加法",
    icon: "➕",
    concept: "先算个位，满十就向十位进一。",
    generate: (n) => repeat(() => addWithin("G2", 100, 12), n),
  },
  {
    key: "g2-sub-100",
    order: 2,
    title: "100以内减法",
    icon: "➖",
    concept: "个位不够减，就向十位借一个十再减。",
    generate: (n) => repeat(() => subWithin("G2", 100, 12), n),
  },
  {
    key: "g2-multiply",
    order: 3,
    title: "乘法的认识",
    icon: "✖️",
    concept: "几个相同的数加起来，就是乘法：3 行每行 2 个，就是 3×2。",
    generate: (n) => repeat(() => multiplyFact("G2"), n),
  },
  {
    key: "g2-length",
    order: 4,
    title: "米和厘米",
    icon: "📏",
    concept: "1 米等于 100 厘米，换算时数一数有几个 100。",
    generate: (n) => repeat(() => unitConversion("G2"), n),
  },
  {
    key: "g2-word",
    order: 5,
    title: "解决问题",
    icon: "📝",
    concept: "读懂题目，想清楚是合起来还是拿走，再列式计算。",
    generate: (n) => repeat(() => wordProblem("G2"), n),
  },
];

// G3 乘除 + 分数 + 应用：表内乘法、平均分除法、认识分数、几时几分、解决问题。
const G3_LESSONS: MathLesson[] = [
  {
    key: "g3-multiply",
    order: 1,
    title: "10以内乘法",
    icon: "✖️",
    concept: "横着几行、每行几个，乘起来就是一共多少个。",
    generate: (n) => repeat(() => multiplyFact("G3"), n),
  },
  {
    key: "g3-divide",
    order: 2,
    title: "10以内除法",
    icon: "➗",
    concept: "把总数平均分成几组，每组有几个就是答案。",
    generate: (n) => repeat(() => divideFact("G3"), n),
  },
  {
    key: "g3-fraction",
    order: 3,
    title: "认识分数",
    icon: "🍰",
    concept: "平均分成几份、取了其中几份，就是几分之几。",
    generate: (n) => repeat(() => fractionProblem("G3"), n),
  },
  {
    key: "g3-clock",
    order: 4,
    title: "几时几分",
    icon: "🕐",
    concept: "短针看时，长针每走一大格是 5 分钟。",
    generate: (n) => repeat(() => timeProblem("G3"), n),
  },
  {
    key: "g3-word",
    order: 5,
    title: "解决问题",
    icon: "📝",
    concept: "先想清楚是加减还是乘除，再列式算出答案。",
    generate: (n) => repeat(() => wordProblem("G3"), n),
  },
];

const CURRICULUM: Partial<Record<Grade, MathLesson[]>> = {
  K1: K1_LESSONS,
  K2: K2_LESSONS,
  K3: K3_LESSONS,
  G1: G1_LESSONS,
  G2: G2_LESSONS,
  G3: G3_LESSONS,
};

// The ordered lesson path for a grade, or null when that grade has no guided curriculum yet
// (callers fall back to the classic mixed practice round).
export function getMathCurriculum(grade: Grade): MathLesson[] | null {
  return CURRICULUM[grade] ?? null;
}
