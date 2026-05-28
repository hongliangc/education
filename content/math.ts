// 趣味算术 — 加减乘
import { shuffle } from "@/lib/utils";

export interface MathProblem {
  question: string;
  answer: number;
  visual?: string[];
}

const RAW: MathProblem[] = [
  { question: "1 + 2", answer: 3, visual: ["🍎", "🍎🍎"] },
  { question: "2 + 3", answer: 5, visual: ["⭐⭐", "⭐⭐⭐"] },
  { question: "4 + 1", answer: 5, visual: ["🌸🌸🌸🌸", "🌸"] },
  { question: "3 + 3", answer: 6, visual: ["🐝🐝🐝", "🐝🐝🐝"] },
  { question: "5 - 2", answer: 3, visual: ["🍭🍭🍭🍭🍭", "− 2"] },
  { question: "6 - 4", answer: 2, visual: ["🎈🎈🎈🎈🎈🎈", "− 4"] },
  { question: "2 × 3", answer: 6, visual: ["🐟🐟", "🐟🐟", "🐟🐟"] },
  { question: "4 × 2", answer: 8, visual: ["🍓🍓🍓🍓", "🍓🍓🍓🍓"] },
  { question: "7 + 2", answer: 9 },
  { question: "9 - 3", answer: 6 },
];

export function generateMathRound(n = 5): MathProblem[] {
  return shuffle(RAW).slice(0, n);
}

export function generateChoices(answer: number): number[] {
  const opts = new Set<number>([answer]);
  while (opts.size < 4) {
    const delta = Math.floor(Math.random() * 5) - 2;
    const v = Math.max(0, answer + delta + (delta === 0 ? 1 : 0));
    opts.add(v);
  }
  return shuffle(Array.from(opts));
}
