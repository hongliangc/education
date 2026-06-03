// content/storybooks/index.ts
import type { StoryBook } from "./types";
import { JOURNEY_TO_THE_WEST } from "./journey-to-the-west";
import { TALES } from "./tales";

// 顺序即书架默认展示顺序：长篇在前，短篇随后。
export const STORY_BOOKS: StoryBook[] = [JOURNEY_TO_THE_WEST, ...TALES];

export type { StoryBook, Chapter, StoryQuestion } from "./types";
