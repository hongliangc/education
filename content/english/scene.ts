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
  icon: string; // scene emoji shown in the header and the scene picker
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
  icon: "🛒",
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

// Opener / easiest scene: greetings + "How are you?" answered with a feeling word.
export const GREETINGS: EnglishScene = {
  id: "greetings",
  title: "Hello! How Are You?",
  zhTitle: "打招呼",
  icon: "👋",
  level: "pre-A1",
  grade: "K1",
  words: [
    { id: "happy", en: "happy", zh: "开心", emoji: "😊", phonics: "ha-ppy" },
    { id: "good", en: "good", zh: "很好", emoji: "👍", phonics: "g-ood" },
    { id: "fine", en: "fine", zh: "还好", emoji: "🙂", phonics: "f-ine" },
    { id: "great", en: "great", zh: "棒极了", emoji: "🤩", phonics: "gr-eat" },
  ],
  pattern: "I am ___ .",
  dialogue: [
    { speaker: "fairy", text: "Hello! I'm Fairy. Nice to meet you!", zh: "你好！我是小精灵。很高兴认识你！" },
    {
      speaker: "child",
      text: "Hello! Nice to meet you, too!",
      zh: "你好！我也很高兴认识你！",
      accept: ["hello", "hi", "nice to meet you"],
    },
    { speaker: "fairy", text: "How are you today?", zh: "你今天好吗？" },
    { speaker: "child", text: "I am happy!", zh: "我很开心！", accept: ["happy", "good", "fine", "great"] },
    { speaker: "fairy", text: "Me too! Let's play together!", zh: "我也是！我们一起玩吧！" },
    {
      speaker: "child",
      text: "Goodbye! See you!",
      zh: "再见！回头见！",
      accept: ["goodbye", "bye", "bye bye", "see you"],
    },
  ],
};

// "This is my ___" — introduce my own classroom things.
export const SCHOOL: EnglishScene = {
  id: "school",
  title: "At School",
  zhTitle: "在学校",
  icon: "🏫",
  level: "pre-A1",
  grade: "K1",
  words: [
    { id: "pencil", en: "pencil", zh: "铅笔", emoji: "✏️", phonics: "pen-cil" },
    { id: "book", en: "book", zh: "书", emoji: "📚", phonics: "b-ook" },
    { id: "bag", en: "bag", zh: "书包", emoji: "🎒", phonics: "b-ag" },
    { id: "ruler", en: "ruler", zh: "尺子", emoji: "📏", phonics: "ru-ler" },
  ],
  pattern: "This is my ___ .",
  dialogue: [
    { speaker: "fairy", text: "Good morning! Welcome to our class!", zh: "早上好！欢迎来到我们的教室！" },
    { speaker: "child", text: "Good morning!", zh: "早上好！", accept: ["good morning", "morning"] },
    { speaker: "fairy", text: "What is in your bag? Show me!", zh: "你书包里有什么？给我看看！" },
    {
      speaker: "child",
      text: "This is my pencil.",
      zh: "这是我的铅笔。",
      accept: ["pencil", "book", "bag", "ruler"],
    },
    { speaker: "fairy", text: "Wow, nice! And this one?", zh: "哇，真好！这个呢？" },
    {
      speaker: "child",
      text: "This is my book.",
      zh: "这是我的书。",
      accept: ["pencil", "book", "bag", "ruler"],
    },
    { speaker: "fairy", text: "Great! Let's start our class!", zh: "太棒了！我们开始上课吧！" },
  ],
};

// "I can see a ___" — describe the animals you spot (singular + article a).
export const ZOO: EnglishScene = {
  id: "zoo",
  title: "At the Zoo",
  zhTitle: "在动物园",
  icon: "🦁",
  level: "pre-A1+",
  grade: "K2",
  words: [
    { id: "lion", en: "lion", zh: "狮子", emoji: "🦁", phonics: "li-on" },
    { id: "monkey", en: "monkey", zh: "猴子", emoji: "🐒", phonics: "mon-key" },
    { id: "elephant", en: "elephant", zh: "大象", emoji: "🐘", phonics: "e-le-phant" },
    { id: "bear", en: "bear", zh: "熊", emoji: "🐻", phonics: "b-ear" },
    { id: "zebra", en: "zebra", zh: "斑马", emoji: "🦓", phonics: "ze-bra" },
  ],
  pattern: "I can see a ___ .",
  dialogue: [
    { speaker: "fairy", text: "Welcome to the zoo! Look over there!", zh: "欢迎来到动物园！看那边！" },
    {
      speaker: "child",
      text: "I can see a lion!",
      zh: "我看见一只狮子！",
      accept: ["lion", "monkey", "elephant", "bear", "zebra"],
    },
    { speaker: "fairy", text: "Yes! It is big and strong. What else?", zh: "对！它又大又强壮。还有什么？" },
    {
      speaker: "child",
      text: "I can see a monkey!",
      zh: "我看见一只猴子！",
      accept: ["lion", "monkey", "elephant", "bear", "zebra"],
    },
    { speaker: "fairy", text: "Haha, the monkey is so funny!", zh: "哈哈，猴子真有趣！" },
    {
      speaker: "child",
      text: "Bye bye, animals!",
      zh: "再见，动物们！",
      accept: ["bye", "bye bye", "goodbye"],
    },
  ],
};

// "Here is a ___ for you" — give gifts and good wishes (longer A1 frame).
export const PARTY: EnglishScene = {
  id: "party",
  title: "Birthday Party",
  zhTitle: "生日派对",
  icon: "🎂",
  level: "A1",
  grade: "K3",
  words: [
    { id: "cake", en: "cake", zh: "蛋糕", emoji: "🎂", phonics: "c-ake" },
    { id: "gift", en: "gift", zh: "礼物", emoji: "🎁", phonics: "g-ift" },
    { id: "balloon", en: "balloon", zh: "气球", emoji: "🎈", phonics: "ba-lloon" },
    { id: "candle", en: "candle", zh: "蜡烛", emoji: "🕯️", phonics: "can-dle" },
    { id: "card", en: "card", zh: "卡片", emoji: "💌", phonics: "c-ard" },
  ],
  pattern: "Here is a ___ for you.",
  dialogue: [
    { speaker: "fairy", text: "Happy birthday! Come in, come in!", zh: "生日快乐！快进来！" },
    {
      speaker: "child",
      text: "Thank you! Here is a gift for you.",
      zh: "谢谢！这是给你的礼物。",
      accept: ["cake", "gift", "balloon", "candle", "card"],
    },
    { speaker: "fairy", text: "Wow, for me? You are so kind!", zh: "哇，给我的？你真好！" },
    {
      speaker: "child",
      text: "Here is a card for you, too!",
      zh: "还有一张卡片送你！",
      accept: ["cake", "gift", "balloon", "candle", "card"],
    },
    { speaker: "fairy", text: "I love it! Let's eat the cake!", zh: "我好喜欢！我们来吃蛋糕吧！" },
    {
      speaker: "child",
      text: "Yummy! Happy birthday!",
      zh: "真好吃！生日快乐！",
      accept: ["happy birthday", "thank you", "yummy"],
    },
    { speaker: "fairy", text: "What a happy day!", zh: "真是开心的一天！" },
  ],
};

// "I'd like ___, please" — order food politely (most words, longest dialogue).
export const RESTAURANT: EnglishScene = {
  id: "restaurant",
  title: "At the Restaurant",
  zhTitle: "在餐厅",
  icon: "🍜",
  level: "A1",
  grade: "K3",
  words: [
    { id: "rice", en: "rice", zh: "米饭", emoji: "🍚", phonics: "r-ice" },
    { id: "noodles", en: "noodles", zh: "面条", emoji: "🍜", phonics: "noo-dles" },
    { id: "soup", en: "soup", zh: "汤", emoji: "🍲", phonics: "s-oup" },
    { id: "juice", en: "juice", zh: "果汁", emoji: "🧃", phonics: "ju-ice" },
    { id: "bread", en: "bread", zh: "面包", emoji: "🍞", phonics: "br-ead" },
    { id: "egg", en: "egg", zh: "鸡蛋", emoji: "🥚", phonics: "e-gg" },
  ],
  pattern: "I'd like ___ , please.",
  dialogue: [
    { speaker: "fairy", text: "Hello! Welcome! Here is the menu.", zh: "你好！欢迎光临！这是菜单。" },
    {
      speaker: "child",
      text: "Thank you. I'd like noodles, please.",
      zh: "谢谢。我想要面条。",
      accept: ["rice", "noodles", "soup", "juice", "bread", "egg"],
    },
    { speaker: "fairy", text: "Good choice! Anything to drink?", zh: "好选择！要喝点什么吗？" },
    {
      speaker: "child",
      text: "I'd like juice, please.",
      zh: "我想要果汁。",
      accept: ["rice", "noodles", "soup", "juice", "bread", "egg"],
    },
    { speaker: "fairy", text: "Sure! Here you are. Enjoy your meal!", zh: "好的！给你。请慢用！" },
    {
      speaker: "child",
      text: "Thank you very much!",
      zh: "非常感谢！",
      accept: ["thank you", "thanks", "thank you very much"],
    },
    { speaker: "fairy", text: "You're welcome! See you next time!", zh: "不客气！下次见！" },
  ],
};

// All scenes the demo can play, ordered easiest → hardest (the picker follows this order).
export const ENGLISH_SCENES: readonly EnglishScene[] = [
  GREETINGS,
  FRUIT_SHOP,
  SCHOOL,
  ZOO,
  PARTY,
  RESTAURANT,
];

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
