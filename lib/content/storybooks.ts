// lib/content/storybooks.ts
import { STORY_BOOKS } from "@/content/storybooks";
import type { StoryBook } from "@/content/storybooks/types";

export function getAllBooks(): StoryBook[] {
  return STORY_BOOKS;
}

export function getBook(id: string): StoryBook | undefined {
  return STORY_BOOKS.find((b) => b.id === id);
}

export function getBooksByAge(band: StoryBook["ageBand"]): StoryBook[] {
  return STORY_BOOKS.filter((b) => b.ageBand === band);
}

export function validateStoryBooks(books: StoryBook[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const b of books) {
    if (ids.has(b.id)) errors.push(`重复 book id: ${b.id}`);
    ids.add(b.id);
    if (b.kind === "tale" && b.chapters.length !== 1)
      errors.push(`${b.id}: tale 必须恰好 1 章（现 ${b.chapters.length}）`);
    if (b.chapters.length === 0) errors.push(`${b.id}: 至少要有 1 章`);
    b.chapters.forEach((c, i) => {
      if (c.idx !== i) errors.push(`${b.id} 第${i}章: idx=${c.idx} 不连续`);
      if (c.questions.length < 2 || c.questions.length > 3)
        errors.push(`${b.id} 第${i}章: 需 2–3 题（现 ${c.questions.length}）`);
      c.questions.forEach((q, qi) => {
        if (q.answer < 0 || q.answer >= q.choices.length)
          errors.push(`${b.id} 第${i}章 第${qi}题: answer 越界`);
      });
    });
  }
  return errors;
}

if (process.env.NODE_ENV !== "production") {
  const errs = validateStoryBooks(STORY_BOOKS);
  if (errs.length) {
    throw new Error("StoryBook 内容校验失败:\n" + errs.join("\n"));
  }
}
