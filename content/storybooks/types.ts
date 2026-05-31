// content/storybooks/types.ts
// 故事内容子系统的唯一类型来源（StoryBook → Chapter）。纯数据，无 React、无 @/ 别名。

export interface StoryQuestion {
  q: string;
  choices: string[];
  answer: number; // 正确选项 index（0-based，必须落在 choices 范围内）
  explain: string;
}

export interface Chapter {
  idx: number; // 0-based；决定顺序解锁与续读
  title: string;
  emoji: string;
  text: string; // 改编儿童版正文，约 300–600 字；段落用 \n 分隔（StoryReader 逐字渲染）
  questions: StoryQuestion[]; // 每章 2–3 题
  moral?: string; // 章末道理；短篇必填，长篇可逐章给或书末给
}

export interface StoryBook {
  id: string; // kebab-case，全局唯一，对应 ReadingProgress.bookId
  title: string;
  emoji: string;
  author?: string; // 如 "根据公有领域《西游记》改编"
  kind: "tale" | "novel"; // 短篇=tale(恰 1 章) / 长篇=novel(多章)
  ageBand: "5-7" | "8-10";
  chapters: Chapter[];
}
