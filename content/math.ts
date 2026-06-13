import type { Grade } from "@/lib/grades";

// Grade-driven math content. Every problem carries a uniform prompt + string choices so the
// round UI stays simple, plus kind-specific fields that drive the visual aid and guidance.

export type MathOperator = "+" | "-" | "×" | "÷";

export type ProblemKind =
  | "arithmetic"
  | "comparison"
  | "shape"
  | "time"
  | "measurement"
  | "fraction"
  | "word";

interface BaseProblem {
  id: string; // stable within a grade so the mistake book can dedupe by question
  grade: Grade;
  prompt: string;
  choices: string[];
  answer: string;
}

export interface ArithmeticProblem extends BaseProblem {
  kind: "arithmetic";
  op: MathOperator;
  operands: [number, number];
}

export interface ComparisonProblem extends BaseProblem {
  kind: "comparison";
  left: number;
  right: number;
}

export interface ShapeProblem extends BaseProblem {
  kind: "shape";
  shape: string;
}

export interface TimeProblem extends BaseProblem {
  kind: "time";
  hour: number;
  minute: number;
}

export interface MeasurementProblem extends BaseProblem {
  kind: "measurement";
  bars?: Array<{ label: string; length: number }>;
}

export interface FractionProblem extends BaseProblem {
  kind: "fraction";
  numerator: number;
  denominator: number;
}

export interface WordProblem extends BaseProblem {
  kind: "word";
  op: MathOperator;
  operands: [number, number];
}

export type MathProblem =
  | ArithmeticProblem
  | ComparisonProblem
  | ShapeProblem
  | TimeProblem
  | MeasurementProblem
  | FractionProblem
  | WordProblem;

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = randomInt(0, index);
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
  return items;
}

function pick<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!;
}

function idOf(grade: Grade, kind: ProblemKind, key: string): string {
  return `${grade}:${kind}:${key}`;
}

// Four numeric options including the answer, spread wider for larger numbers.
function numberChoices(answer: number, spread: number): string[] {
  const set = new Set<number>([answer]);
  const candidates: number[] = [];
  for (let delta = 1; delta <= spread; delta++) candidates.push(answer - delta, answer + delta);
  for (const candidate of shuffle(candidates)) {
    if (candidate >= 0) set.add(candidate);
    if (set.size === 4) break;
  }
  return shuffle(Array.from(set)).map(String);
}

function arithmetic(
  grade: Grade,
  op: MathOperator,
  a: number,
  b: number,
  answer: number,
  spread: number,
): ArithmeticProblem {
  const prompt = `${a} ${op} ${b}`;
  return {
    kind: "arithmetic",
    id: idOf(grade, "arithmetic", prompt),
    grade,
    op,
    operands: [a, b],
    prompt,
    answer: String(answer),
    choices: numberChoices(answer, spread),
  };
}

export function addWithin(grade: Grade, max: number, spread: number): ArithmeticProblem {
  const a = randomInt(0, max);
  const b = randomInt(0, max - a);
  return arithmetic(grade, "+", a, b, a + b, spread);
}

export function subWithin(grade: Grade, max: number, spread: number): ArithmeticProblem {
  const a = randomInt(0, max);
  const b = randomInt(0, a);
  return arithmetic(grade, "-", a, b, a - b, spread);
}

export function tenBondAddWithin(
  grade: Grade,
  max: number,
  spread: number,
): ArithmeticProblem {
  const a = randomInt(1, max - 1);
  const b = randomInt(1, max - a);
  return arithmetic(grade, "+", a, b, a + b, spread);
}

export function tenBondSubWithin(
  grade: Grade,
  max: number,
  spread: number,
): ArithmeticProblem {
  const a = randomInt(2, max);
  const b = randomInt(1, a - 1);
  return arithmetic(grade, "-", a, b, a - b, spread);
}

export function crossingAddWithin(grade: Grade, spread: number): ArithmeticProblem {
  const a = randomInt(2, 9);
  const b = randomInt(11 - a, 9);
  return arithmetic(grade, "+", a, b, a + b, spread);
}

export function borrowSubWithin(grade: Grade, spread: number): ArithmeticProblem {
  const a = randomInt(11, 18);
  const b = randomInt(a - 9, 9);
  return arithmetic(grade, "-", a, b, a - b, spread);
}

function addSubWithin(grade: Grade, max: number, spread: number): ArithmeticProblem {
  return Math.random() < 0.5 ? addWithin(grade, max, spread) : subWithin(grade, max, spread);
}

// Times-table facts: factors 1-9, division derived from a product so it divides exactly.
export function multiplyFact(grade: Grade): ArithmeticProblem {
  const a = randomInt(1, 9);
  const b = randomInt(1, 9);
  return arithmetic(grade, "×", a, b, a * b, 6);
}

export function divideFact(grade: Grade): ArithmeticProblem {
  const a = randomInt(1, 9);
  const b = randomInt(1, 9);
  return arithmetic(grade, "÷", a * b, a, b, 5);
}

function timesTable(grade: Grade): ArithmeticProblem {
  return Math.random() < 0.5 ? multiplyFact(grade) : divideFact(grade);
}

// Multi-digit multiplication (two-digit × one-digit) and the matching exact division.
function multiDigit(grade: Grade): ArithmeticProblem {
  const factor = randomInt(2, 9);
  const big = randomInt(11, 99);
  if (Math.random() < 0.5) return arithmetic(grade, "×", big, factor, big * factor, 30);
  return arithmetic(grade, "÷", big * factor, factor, big, 30);
}

export function comparison(grade: Grade, max: number): ComparisonProblem {
  const left = randomInt(0, max);
  const right = randomInt(0, max);
  const answer = left > right ? ">" : left < right ? "<" : "=";
  const prompt = `${left} ◯ ${right}`;
  return {
    kind: "comparison",
    id: idOf(grade, "comparison", prompt),
    grade,
    left,
    right,
    prompt,
    answer,
    choices: [">", "<", "="],
  };
}

const SHAPES = [
  { emoji: "🔺", name: "三角形" },
  { emoji: "🟦", name: "正方形" },
  { emoji: "⚪", name: "圆形" },
  { emoji: "⭐", name: "星形" },
  { emoji: "💛", name: "爱心" },
];

export function shapeProblem(grade: Grade): ShapeProblem {
  const options = shuffle([...SHAPES]).slice(0, 4);
  const target = pick(options);
  const prompt = `哪个是${target.name}?`;
  return {
    kind: "shape",
    id: idOf(grade, "shape", prompt),
    grade,
    shape: target.emoji,
    prompt,
    answer: target.emoji,
    choices: shuffle(options.map((option) => option.emoji)),
  };
}

function formatTime(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function timeProblem(grade: Grade): TimeProblem {
  const minutes = grade === "G3" ? [0, 15, 30, 45] : [0, 30];
  const hour = randomInt(1, 12);
  const minute = pick(minutes);
  const answer = formatTime(hour, minute);
  const choices = new Set<string>([answer]);
  while (choices.size < 4) {
    choices.add(formatTime(randomInt(1, 12), pick(minutes)));
  }
  return {
    kind: "time",
    id: idOf(grade, "time", answer),
    grade,
    hour,
    minute,
    prompt: "时钟显示几点啦?",
    answer,
    choices: shuffle(Array.from(choices)),
  };
}

const DENOMINATORS = [2, 3, 4, 5, 6, 8];

export function fractionProblem(grade: Grade): FractionProblem {
  const denominator = pick(DENOMINATORS);
  const numerator = randomInt(1, denominator - 1);
  const answer = `${numerator}/${denominator}`;
  const choices = new Set<string>([answer]);
  while (choices.size < 4) {
    const d = pick(DENOMINATORS);
    choices.add(`${randomInt(1, d - 1)}/${d}`);
  }
  return {
    kind: "fraction",
    id: idOf(grade, "fraction", answer),
    grade,
    numerator,
    denominator,
    prompt: "涂色部分是几分之几?",
    answer,
    choices: shuffle(Array.from(choices)),
  };
}

const LENGTH_ITEMS = ["铅笔", "绳子", "尺子", "丝带", "吸管"];

export function compareLength(grade: Grade): MeasurementProblem {
  const items = shuffle([...LENGTH_ITEMS]).slice(0, 3);
  const lengths = shuffle([4, 8, 12, 16, 20]).slice(0, 3);
  const bars = items.map((label, index) => ({ label, length: lengths[index]! }));
  const longest = bars.reduce((best, bar) => (bar.length > best.length ? bar : best));
  return {
    kind: "measurement",
    id: idOf(grade, "measurement", bars.map((bar) => `${bar.label}${bar.length}`).join("-")),
    grade,
    bars,
    prompt: "哪个最长?",
    answer: longest.label,
    choices: shuffle(bars.map((bar) => bar.label)),
  };
}

export function unitConversion(grade: Grade): MeasurementProblem {
  const meters = randomInt(1, 9);
  const cm = meters * 100;
  const prompt = `${meters} 米 = ? 厘米`;
  const choices = new Set<number>([cm]);
  while (choices.size < 4) choices.add(randomInt(1, 9) * 100);
  return {
    kind: "measurement",
    id: idOf(grade, "measurement", prompt),
    grade,
    prompt,
    answer: String(cm),
    choices: shuffle(Array.from(choices)).map(String),
  };
}

export function wordProblem(grade: Grade): WordProblem {
  const big = grade === "G3";
  const spread = big ? 25 : 10;
  const roll = randomInt(0, 2);
  let prompt: string;
  let op: MathOperator;
  let a: number;
  let b: number;
  let answer: number;
  if (roll === 0) {
    a = randomInt(big ? 100 : 10, big ? 800 : 60);
    b = randomInt(big ? 50 : 5, big ? 200 : 30);
    op = "+";
    answer = a + b;
    prompt = `小明有 ${a} 元，又攒了 ${b} 元，一共多少元?`;
  } else if (roll === 1) {
    a = randomInt(big ? 400 : 40, big ? 900 : 90);
    b = randomInt(1, big ? 300 : 30);
    op = "-";
    answer = a - b;
    prompt = `书架上有 ${a} 本书，借走 ${b} 本，还剩多少本?`;
  } else {
    a = randomInt(2, 9);
    b = randomInt(2, 9);
    op = "×";
    answer = a * b;
    prompt = `每盒装 ${b} 块饼干，${a} 盒一共多少块?`;
  }
  return {
    kind: "word",
    id: idOf(grade, "word", prompt),
    grade,
    op,
    operands: [a, b],
    prompt,
    answer: String(answer),
    choices: numberChoices(answer, spread),
  };
}

// The kinds each grade draws from, per the approved K1-G3 content ranges.
function generators(grade: Grade): Array<() => MathProblem> {
  switch (grade) {
    case "K1":
      return [() => addWithin("K1", 5, 4), () => comparison("K1", 5), () => shapeProblem("K1")];
    case "K2":
      return [
        () => addSubWithin("K2", 10, 4),
        () => comparison("K2", 10),
        () => shapeProblem("K2"),
      ];
    case "K3":
      return [
        () => addSubWithin("K3", 10, 4),
        () => comparison("K3", 10),
        () => compareLength("K3"),
      ];
    case "G1":
      return [
        () => addSubWithin("G1", 20, 6),
        () => comparison("G1", 100),
        () => timeProblem("G1"),
        () => shapeProblem("G1"),
      ];
    case "G2":
      return [
        () => addSubWithin("G2", 100, 12),
        () => timesTable("G2"),
        () => unitConversion("G2"),
        () => wordProblem("G2"),
      ];
    case "G3":
      return [
        () => addSubWithin("G3", 10000, 30),
        () => multiDigit("G3"),
        () => fractionProblem("G3"),
        () => timeProblem("G3"),
        () => wordProblem("G3"),
      ];
  }
}

export function generateRound(grade: Grade, n = 5): MathProblem[] {
  if (n <= 0) return [];
  const gens = generators(grade);
  return Array.from({ length: n }, () => pick(gens)());
}
