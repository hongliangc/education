// content/classics/index.ts
// 「诸子智慧」文学模块内容入口：寓言（StoryBook）+ 名句卡组（QuoteDeck）。
import type { StoryBook } from "../storybooks/types";
import { validateStoryBooks } from "@/lib/content/storybooks";
import { PARABLES } from "./parables";
import { QUOTE_DECKS } from "./decks";
import { CLASSIC_TEXTS } from "./classicTexts";
import type { ClassicText, QuoteDeck } from "./types";

export { PARABLES } from "./parables";
export { QUOTE_DECKS } from "./decks";
export { CLASSIC_TEXTS } from "./classicTexts";
export type { ClassicLine, ClassicText, GlossaryEntry, QuoteCard, QuoteDeck } from "./types";

export function getParable(id: string): StoryBook | undefined {
  return PARABLES.find((b) => b.id === id);
}

export function getDeck(id: string): QuoteDeck | undefined {
  return QUOTE_DECKS.find((d) => d.id === id);
}

// 寓言的「经典原文版」精选名段；缺省（未试点的寓言）返回 undefined，阅读页只显示改编版。
export function getClassicText(id: string): ClassicText | undefined {
  return CLASSIC_TEXTS[id];
}

// dev 守卫：寓言复用 StoryBook 结构，沿用同一份校验（tale 恰 1 章、idx 连续、2–3 题、answer 不越界）。
if (process.env.NODE_ENV !== "production") {
  const errs = validateStoryBooks(PARABLES);
  const parableIds = new Set(PARABLES.map((b) => b.id));
  for (const [id, ct] of Object.entries(CLASSIC_TEXTS)) {
    if (!parableIds.has(id)) errs.push(`经典原文 key 没有对应寓言: ${id}`);
    if (ct.lines.length === 0) errs.push(`${id}: 经典原文至少要有 1 句`);
  }
  const deckIds = new Set<string>();
  for (const d of QUOTE_DECKS) {
    if (deckIds.has(d.id)) errs.push(`重复 deck id: ${d.id}`);
    deckIds.add(d.id);
    if (d.cards.length === 0) errs.push(`${d.id}: 卡组至少要有 1 张卡`);
    const cardIds = new Set<string>();
    for (const c of d.cards) {
      if (cardIds.has(c.id)) errs.push(`${d.id}: 重复 card id ${c.id}`);
      cardIds.add(c.id);
      const q = c.question;
      if (q.choices.length < 2) errs.push(`${d.id}/${c.id}: 题目至少要有 2 个选项`);
      if (q.answer < 0 || q.answer >= q.choices.length)
        errs.push(`${d.id}/${c.id}: 答案下标越界`);
    }
  }
  if (errs.length) {
    throw new Error("classics 内容校验失败:\n" + errs.join("\n"));
  }
}
