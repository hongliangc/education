// The scene data model for the English speaking demo (design §5). A self-contained leaf: it carries
// only the erased `Grade` type import, so the Node test runner loads it directly and the app/build
// composes it. One scene drives all five stages — meet the words, listen & find, say it, swap the
// pattern, then role-play with the fairy — so the stage components stay pure renderers of this shape.
import type { Grade } from "@/lib/grades";

export interface EnglishWord {
  id: string;
  en: string;
  zh: string;
  emoji: string;
  phonics?: string; // child-friendly decoding cue for step ① (e.g. "a-pp-le")
}

// One line of the role-play (step ⑤). For child turns, `accept` is the closed set of spoken answers
// that count (passed to matchSpokenWord) — semi-open, so any listed fruit/phrase is accepted.
export interface RolePlayTurn {
  speaker: "fairy" | "child";
  text: string;
  zh?: string; // optional Chinese gloss shown under the line
  accept?: string[];
}

export interface EnglishScene {
  id: string;
  title: string; // English title, e.g. "At the Fruit Shop"
  zhTitle: string;
  level: string; // CEFR band label, e.g. "pre-A1"
  grade: Grade;
  words: EnglishWord[];
  pattern: string; // sentence frame for step ④, carrying a "___" blank
  dialogue: RolePlayTurn[];
}

export const FRUIT_SHOP: EnglishScene = {
  id: "fruit-shop",
  title: "At the Fruit Shop",
  zhTitle: "在水果店",
  level: "pre-A1",
  grade: "K1",
  words: [
    { id: "apple", en: "apple", zh: "苹果", emoji: "🍎", phonics: "a-pp-le" },
    { id: "banana", en: "banana", zh: "香蕉", emoji: "🍌", phonics: "ba-na-na" },
    { id: "orange", en: "orange", zh: "橙子", emoji: "🍊", phonics: "or-ange" },
    { id: "grapes", en: "grapes", zh: "葡萄", emoji: "🍇", phonics: "gr-apes" },
  ],
  pattern: "I like ___ .",
  dialogue: [
    {
      speaker: "fairy",
      text: "Hello! Welcome to my shop! What do you want?",
      zh: "你好！欢迎光临！你想要什么？",
    },
    {
      speaker: "child",
      text: "I want apples, please.",
      zh: "我想要苹果，谢谢。",
      accept: ["apple", "banana", "orange", "grapes"],
    },
    { speaker: "fairy", text: "Here you are! Anything else?", zh: "给你！还要别的吗？" },
    { speaker: "child", text: "Thank you!", zh: "谢谢！", accept: ["thank you", "thanks"] },
    { speaker: "fairy", text: "Goodbye!", zh: "再见！" },
  ],
};

// All scenes the demo can play (room to add more later without touching the page).
export const ENGLISH_SCENES: readonly EnglishScene[] = [FRUIT_SHOP];

// Step ② tiles: the answer plus up to three distinct distractors from the same scene, shuffled.
// `rng` is injectable so tests can pin the order; the answer is always included.
export function buildListenChoices(
  scene: EnglishScene,
  answerId: string,
  rng: () => number = Math.random,
): EnglishWord[] {
  const answer = scene.words.find((w) => w.id === answerId);
  const distractors = shuffle(
    scene.words.filter((w) => w.id !== answerId),
    rng,
  ).slice(0, 3);
  const pool = answer ? [answer, ...distractors] : distractors;
  return shuffle(pool, rng);
}

function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
