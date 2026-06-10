// content/classics/index.ts
// 「诸子智慧」文学模块内容入口：寓言（StoryBook）+ 名句卡组（QuoteDeck）。
import type { StoryBook } from "../storybooks/types";
import { validateStoryBooks } from "@/lib/content/storybooks";
import { PARABLES } from "./parables";
import { QUOTE_DECKS } from "./decks";
import type { QuoteDeck } from "./types";

export { PARABLES } from "./parables";
export { QUOTE_DECKS } from "./decks";
export type { QuoteCard, QuoteDeck } from "./types";

export function getParable(id: string): StoryBook | undefined {
  return PARABLES.find((b) => b.id === id);
}

export function getDeck(id: string): QuoteDeck | undefined {
  return QUOTE_DECKS.find((d) => d.id === id);
}

// dev 守卫：寓言复用 StoryBook 结构，沿用同一份校验（tale 恰 1 章、idx 连续、2–3 题、answer 不越界）。
if (process.env.NODE_ENV !== "production") {
  const errs = validateStoryBooks(PARABLES);
  const deckIds = new Set<string>();
  for (const d of QUOTE_DECKS) {
    if (deckIds.has(d.id)) errs.push(`重复 deck id: ${d.id}`);
    deckIds.add(d.id);
    if (d.cards.length === 0) errs.push(`${d.id}: 卡组至少要有 1 张卡`);
    const cardIds = new Set<string>();
    for (const c of d.cards) {
      if (cardIds.has(c.id)) errs.push(`${d.id}: 重复 card id ${c.id}`);
      cardIds.add(c.id);
    }
  }
  if (errs.length) {
    throw new Error("classics 内容校验失败:\n" + errs.join("\n"));
  }
}
