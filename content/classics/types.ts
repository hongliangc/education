// content/classics/types.ts
// 「诸子智慧」文学模块的内容类型来源。纯数据，无 React、无 @/ 别名。
//
// 两类内容并存：
//   1) 寓言（庄子等）→ 直接复用故事子系统的 StoryBook/Chapter（见 ../storybooks/types）。
//   2) 名句卡组（老子/孔子/孟子等）→ 本文件定义的 QuoteCard / QuoteDeck。
import type { StoryQuestion } from "../storybooks/types";

// 关键字 / 词 / 典故的就近注释。寓言挂在 ClassicLine.notes，名句卡挂在卡级 glossary，共用同一形状。
export interface GlossaryEntry {
  term: string; // "虚" / "栩栩然" / "物化"
  kind: "字" | "词" | "典故";
  explain: string; // 6–10 岁可懂的解释（1–2 句）
}

// 经典原文的一句逐句精读：原句 → (拼音) → 白话直译 → 该句关键字词/典故。
export interface ClassicLine {
  original: string; // 文言文原句（公有领域《庄子》等，ctext.org）
  pinyin?: string; // 选填：整句或难字注音
  translation: string; // 白话直译（贴原句，不发挥）
  notes?: GlossaryEntry[]; // 这一句里的关键字/词/典故
}

// 一则经典的精选名段：出处 + 引子 + 逐句。键由 CLASSIC_TEXTS 用寓言 id 关联。
export interface ClassicText {
  source: string; // "《庄子·秋水》"
  intro?: string; // 一句话引子：这段在讲什么
  lines: ClassicLine[]; // 逐句精读，按原文顺序
}

export interface QuoteCard {
  id: string; // deck 内唯一
  text: string; // 原句，如 "上善若水"
  pinyin: string; // 拼音，如 "shàng shàn ruò shuǐ"
  meaning: string; // 童趣白话："最好的品格像水……"
  interpretation: string; // 解读/分析（6–10 岁可懂）
  example?: string; // 联系生活的小例子（可选）
  emoji: string; // 占位 / 回退图标
  image?: string; // public 相对路径；v1 留空，后补静态图
  glossary?: GlossaryEntry[]; // 该名句的关键字/词/典故；缺省则卡片不显示该区
  question: StoryQuestion; // 看完这张卡当场作答的一道理解题（复用故事子系统的题型）
}

export interface QuoteDeck {
  id: string; // 全局唯一，对应 session 聚合维度（与寓言 bookId 不冲突）
  philosopher: string; // "老子"
  source: string; // "《道德经》"
  title: string; // 卡组标题
  emoji: string;
  cards: QuoteCard[];
}
