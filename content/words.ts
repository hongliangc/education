// 单词配对 — 中英 + emoji
export interface WordPair {
  zh: string;
  en: string;
  emoji: string;
}

export const WORDS: WordPair[] = [
  { zh: "猫", en: "Cat", emoji: "🐱" },
  { zh: "狗", en: "Dog", emoji: "🐶" },
  { zh: "苹果", en: "Apple", emoji: "🍎" },
  { zh: "香蕉", en: "Banana", emoji: "🍌" },
  { zh: "太阳", en: "Sun", emoji: "☀️" },
  { zh: "月亮", en: "Moon", emoji: "🌙" },
  { zh: "汽车", en: "Car", emoji: "🚗" },
  { zh: "飞机", en: "Plane", emoji: "✈️" },
  { zh: "书", en: "Book", emoji: "📖" },
  { zh: "雨", en: "Rain", emoji: "🌧️" },
  { zh: "雪", en: "Snow", emoji: "❄️" },
  { zh: "蛋糕", en: "Cake", emoji: "🎂" },
];
