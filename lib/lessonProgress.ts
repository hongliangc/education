// Client-side access to per-lesson progress. The read/write surface is kept small and stable
// so the storage backing (currently the /api/lessons server table) can change without touching
// callers.

export interface LessonProgressEntry {
  stars: number;
  completed: boolean;
}

export type LessonProgressMap = Record<string, LessonProgressEntry>;

export interface SaveLessonInput {
  module: string;
  grade: string;
  lessonKey: string;
  stars: number;
  masteryPct: number;
}

// Pure unlock rule: the first lesson is always open; later lessons unlock once the previous
// lesson is completed. Keeps the guided path strictly sequential.
export function isLessonUnlocked(
  orderedKeys: readonly string[],
  progress: LessonProgressMap,
  index: number,
): boolean {
  if (index <= 0) return true;
  const previous = orderedKeys[index - 1];
  return Boolean(previous && progress[previous]?.completed);
}

interface ApiRow {
  lessonKey: string;
  stars: number;
  completedAt: string | null;
}

export async function fetchLessonProgress(
  childId: string,
  module: string,
  grade: string,
): Promise<LessonProgressMap> {
  const params = new URLSearchParams({ module, grade });
  const res = await fetch(`/api/lessons/${encodeURIComponent(childId)}?${params}`);
  if (!res.ok) return {};
  const data = await res.json().catch(() => ({ progress: [] }));
  const map: LessonProgressMap = {};
  for (const row of (data.progress ?? []) as ApiRow[]) {
    map[row.lessonKey] = { stars: row.stars ?? 0, completed: Boolean(row.completedAt) };
  }
  return map;
}

export async function saveLessonProgress(
  childId: string,
  input: SaveLessonInput,
): Promise<void> {
  try {
    await fetch(`/api/lessons/${encodeURIComponent(childId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    // Network failure: lesson play already advanced locally; progress write is best-effort.
  }
}
