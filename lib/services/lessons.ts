import { prisma } from "@/lib/db";

export interface LessonProgressInput {
  childId: string;
  module: string;
  grade: string;
  lessonKey: string;
  stars: number;
  masteryPct: number;
}

export interface LessonProgressRow {
  lessonKey: string;
  stars: number;
  masteryPct: number;
  completedAt: Date | null;
}

// All of a child's lesson progress for one module + grade (drives the lesson path's node states).
export function getLessonProgress(
  childId: string,
  module: string,
  grade: string,
): Promise<LessonProgressRow[]> {
  return prisma.lessonProgress.findMany({
    where: { childId, module, grade },
    select: { lessonKey: true, stars: true, masteryPct: true, completedAt: true },
  });
}

// Record a finished lesson, keeping the child's best star result for that lesson.
export async function upsertLessonProgress(input: LessonProgressInput): Promise<void> {
  const { childId, module, grade, lessonKey } = input;
  const stars = Math.max(0, Math.floor(input.stars));
  const masteryPct = Math.max(0, Math.min(100, Math.floor(input.masteryPct)));
  const key = { childId_module_grade_lessonKey: { childId, module, grade, lessonKey } };

  const existing = await prisma.lessonProgress.findUnique({
    where: key,
    select: { stars: true },
  });
  const bestStars = Math.max(stars, existing?.stars ?? 0);

  await prisma.lessonProgress.upsert({
    where: key,
    create: { childId, module, grade, lessonKey, stars: bestStars, masteryPct, completedAt: new Date() },
    update: { stars: bestStars, masteryPct, completedAt: new Date() },
  });
}
