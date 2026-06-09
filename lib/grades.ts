// Grade identity shared across learning modules: kindergarten K1-K3 then grades G1-G3.
// `LEGACY` marks pre-grade records and is never an accessible learning grade.

export type Grade = "K1" | "K2" | "K3" | "G1" | "G2" | "G3";

// Ordered from easiest to hardest; array index is the grade's difficulty rank.
export const GRADES: readonly Grade[] = ["K1", "K2", "K3", "G1", "G2", "G3"];

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

// A child may play any valid grade at or below one step above their own.
export function canAccessGrade(childGrade: Grade, targetGrade: string): boolean {
  if (!isGrade(targetGrade)) return false;
  return gradeIndex(targetGrade) <= gradeIndex(childGrade) + 1;
}
