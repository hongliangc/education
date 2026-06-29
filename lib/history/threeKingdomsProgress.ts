// lib/history/threeKingdomsProgress.ts
// 三国详情页「机制全部派生自阅读进度」的纯函数（无 React、无跨内容 import，便于 node:test 直接加载）。
// 输入：completedChapters（/api/reading 已持久化的已读章数）+ 章节 cardKeys。
// 约定（与 StoryCardRow 一致）：章节 idx <= completedChapters 可读；idx < completedChapters 已读完。

export type CollectState = "locked" | "met" | "known";

export interface ChapterRef {
  cardKeys?: string[];
}

export type BadgeCondition =
  | { type: "chaptersAtLeast"; n: number }
  | { type: "chapterDone"; idx: number }
  | { type: "peopleKnownAtLeast"; n: number };

export type EventStatus = "info" | "locked" | "open" | "cleared";

/** 含某人物 cardKey 的最小章节 idx；不存在则 Infinity。 */
function minChapterIdxFor(personKey: string, chapters: ChapterRef[]): number {
  let min = Infinity;
  chapters.forEach((c, idx) => {
    if (c.cardKeys?.includes(personKey)) min = Math.min(min, idx);
  });
  return min;
}

/**
 * 核心人物收集态：
 * - known（了解）：所属最早章节已读完（minIdx < completedChapters）
 * - met（相识）：所属最早章节已解锁但未读完（minIdx === completedChapters）
 * - locked（未遇）：所属章节尚未解锁，或人物不在任何章节出现
 */
export function personCollectState(
  personKey: string,
  chapters: ChapterRef[],
  completedChapters: number,
): CollectState {
  const minIdx = minChapterIdxFor(personKey, chapters);
  if (minIdx === Infinity) return "locked";
  if (minIdx < completedChapters) return "known";
  if (minIdx === completedChapters) return "met";
  return "locked";
}

/** 已「了解」（读完其章）的核心人物数。用于计数器与徽章。 */
export function knownCount(
  coreKeys: string[],
  chapters: ChapterRef[],
  completedChapters: number,
): number {
  return coreKeys.filter(
    (k) => personCollectState(k, chapters, completedChapters) === "known",
  ).length;
}

/**
 * 事件状态：
 * - info：背景事件（无 chapterIdx），恒显，不 gate
 * - cleared（已通关）：chapterIdx < completedChapters
 * - open（可挑战）：chapterIdx === completedChapters（点击进阅读）
 * - locked（未解锁）：chapterIdx > completedChapters
 */
export function eventStatus(
  chapterIdx: number | undefined,
  completedChapters: number,
): EventStatus {
  if (chapterIdx === undefined) return "info";
  if (chapterIdx < completedChapters) return "cleared";
  if (chapterIdx === completedChapters) return "open";
  return "locked";
}

/** 徽章是否已获得（派生）。 */
export function badgeEarned(
  condition: BadgeCondition,
  ctx: { completedChapters: number; knownCount: number },
): boolean {
  switch (condition.type) {
    case "chaptersAtLeast":
      return ctx.completedChapters >= condition.n;
    case "chapterDone":
      return ctx.completedChapters > condition.idx; // idx 章已读完
    case "peopleKnownAtLeast":
      return ctx.knownCount >= condition.n;
  }
}
