// lib/services/reading.ts
import "server-only";
import { prisma } from "@/lib/db";

export function getReadingProgress(childId: string) {
  return prisma.readingProgress.findMany({ where: { childId } });
}

export function upsertReadingProgress(input: {
  childId: string;
  bookId: string;
  lastChapterIdx: number;
  completedChapters: number;
  finished: boolean;
}) {
  const { childId, bookId, lastChapterIdx, completedChapters, finished } = input;
  return prisma.readingProgress.upsert({
    where: { childId_bookId: { childId, bookId } },
    create: { childId, bookId, lastChapterIdx, completedChapters, finished },
    update: { lastChapterIdx, completedChapters, finished },
  });
}
