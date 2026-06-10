// content/classics/types.ts
// 「诸子智慧」文学模块的内容类型来源。纯数据，无 React、无 @/ 别名。
//
// 两类内容并存：
//   1) 寓言（庄子等）→ 直接复用故事子系统的 StoryBook/Chapter（见 ../storybooks/types）。
//   2) 名句卡组（老子/孔子/孟子等）→ 本文件定义的 QuoteCard / QuoteDeck。

export interface QuoteCard {
  id: string; // deck 内唯一
  text: string; // 原句，如 "上善若水"
  pinyin: string; // 拼音，如 "shàng shàn ruò shuǐ"
  meaning: string; // 童趣白话："最好的品格像水……"
  interpretation: string; // 解读/分析（6–10 岁可懂）
  example?: string; // 联系生活的小例子（可选）
  emoji: string; // 占位 / 回退图标
  image?: string; // public 相对路径；v1 留空，后补静态图
}

export interface QuoteDeck {
  id: string; // 全局唯一，对应 session 聚合维度（与寓言 bookId 不冲突）
  philosopher: string; // "老子"
  source: string; // "《道德经》"
  title: string; // 卡组标题
  emoji: string;
  cards: QuoteCard[];
}
