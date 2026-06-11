// Grade identity shared across learning modules: kindergarten K1-K3 then grades G1-G3.
// `LEGACY` marks pre-grade records and is never an accessible learning grade.

export type Grade = "K1" | "K2" | "K3" | "G1" | "G2" | "G3";

// Ordered from easiest to hardest; array index is the grade's difficulty rank.
export const GRADES: readonly Grade[] = ["K1", "K2", "K3", "G1", "G2", "G3"];

// Child-facing Chinese labels, shared by every grade selector.
export const GRADE_LABELS: Record<Grade, string> = {
  K1: "幼儿园小班",
  K2: "幼儿园中班",
  K3: "幼儿园大班",
  G1: "一年级",
  G2: "二年级",
  G3: "三年级",
};

export function isGrade(value: unknown): value is Grade {
  return typeof value === "string" && (GRADES as readonly string[]).includes(value);
}

function gradeIndex(grade: Grade): number {
  return GRADES.indexOf(grade);
}

// Map a child's age to a starting grade, clamped to the K1-G3 range.
// K1 begins at age 3, advancing one band per year (age 7 → G2).
export function inferGradeFromAge(age: number): Grade {
  const index = Math.floor(age) - 3;
  const clamped = Math.min(GRADES.length - 1, Math.max(0, index));
  return GRADES[clamped];
}

// The grade picker window: one grade below through one above, clamped to range.
export function getRecommendedGrades(grade: Grade): Grade[] {
  const index = gradeIndex(grade);
  const start = Math.max(0, index - 1);
  const end = Math.min(GRADES.length - 1, index + 1);
  return GRADES.slice(start, end + 1);
}

// Kindergarten tiers (K1-K3) that sit below the given grade — review/foundation content.
export function getFoundationGrades(grade: Grade): Grade[] {
  const index = gradeIndex(grade);
  return GRADES.filter(
    (candidate) => candidate.startsWith("K") && gradeIndex(candidate) < index,
  );
}

// The grade picker's two groups: the primary recommended window, plus every grade below
// that window (kindergarten and earlier primary grades) collapsed into a foundation list.
export function buildGradeSelection(grade: Grade): {
  primary: Grade[];
  foundation: Grade[];
} {
  const primary = getRecommendedGrades(grade);
  const lowest = gradeIndex(primary[0]);
  const foundation = GRADES.filter((candidate) => gradeIndex(candidate) < lowest);
  return { primary, foundation };
}

// A child may play any valid grade at or below one step above their own.
export function canAccessGrade(childGrade: Grade, targetGrade: string): boolean {
  if (!isGrade(targetGrade)) return false;
  return gradeIndex(targetGrade) <= gradeIndex(childGrade) + 1;
}

// Clamp a requested practice grade to what the child may access (at or below one step above
// their own); anything out of reach falls back to the child's own grade.
export function clampToAllowedGrade(childGrade: Grade, grade: Grade): Grade {
  return canAccessGrade(childGrade, grade) ? grade : childGrade;
}

// Pre-grade progress is bucketed under LEGACY so it never blends into a confirmed grade.
export const LEGACY_GRADE = "LEGACY";

// Resolve the grade a session should be recorded under, or `null` to reject the request.
// A missing grade falls back to LEGACY (backwards compatible with pre-grade clients); a
// supplied grade must be valid and within reach of the child's confirmed grade — or, before
// confirmation, the grade inferred from their age.
export function resolveSessionGrade(
  child: { gradeLevel: string | null; age: number },
  requested: unknown,
): Grade | typeof LEGACY_GRADE | null {
  if (requested === undefined || requested === null || requested === "") {
    return LEGACY_GRADE;
  }
  if (!isGrade(requested)) return null;
  const ceiling = isGrade(child.gradeLevel)
    ? child.gradeLevel
    : inferGradeFromAge(child.age);
  return canAccessGrade(ceiling, requested) ? requested : null;
}

export interface ModuleSessionRecord {
  gradeLevel: string;
  totalQ: number;
  correctQ: number;
  starsEarned: number;
}

// Summarize one module's progress for a single grade. Sessions must arrive newest-first.
// Mastery averages accuracy over the five most recent in-grade sessions; stars sum the
// whole grade. Other grades (including LEGACY) are filtered out so they stay isolated.
export function summarizeModuleGrade(
  sessions: ModuleSessionRecord[],
  grade: string,
): { masteryPct: number; stars: number } {
  const scoped = sessions.filter((s) => s.gradeLevel === grade);
  const recent = scoped.slice(0, 5);
  const accuracy =
    recent.reduce(
      (sum, s) => sum + (s.totalQ > 0 ? s.correctQ / s.totalQ : 0),
      0,
    ) / Math.max(1, recent.length);
  const stars = scoped.reduce((sum, s) => sum + s.starsEarned, 0);
  return { masteryPct: Math.round(accuracy * 100), stars };
}

// ---------------------------------------------------------------------------
// Progress presentation — shared by the world map and game-completion screens.
// ---------------------------------------------------------------------------

export interface GradeProgressRow {
  module: string;
  gradeLevel: string;
  stars: number;
  masteryPct: number;
}

// Lookup key for a module's progress at a specific grade.
export function progressKey(module: string, grade: string): string {
  return `${module}:${grade}`;
}

// Index progress rows by `<module>:<grade>`, dropping LEGACY pre-grade rows so they never appear
// as current-grade mastery. Their stars still count toward the child's running total elsewhere.
export function indexGradeProgress<T extends GradeProgressRow>(
  rows: readonly T[],
): Map<string, T> {
  const map = new Map<string, T>();
  for (const row of rows) {
    if (row.gradeLevel === LEGACY_GRADE) continue;
    map.set(progressKey(row.module, row.gradeLevel), row);
  }
  return map;
}

// The grade a child's screens default to: their confirmed grade, or one inferred from age.
export function resolveChildGrade(child: { gradeLevel: string | null; age: number }): Grade {
  return isGrade(child.gradeLevel) ? child.gradeLevel : inferGradeFromAge(child.age);
}
