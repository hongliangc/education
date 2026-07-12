// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG } from "./catalog.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_UNITS, type HanziCurriculumUnit } from "./curriculum.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziDomainAdapter } from "./domain-adapter.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziStatus, type HanziProgressMap } from "./progress.ts";
import type { Grade } from "../../lib/grades.ts";

export interface HanziDiagnosticTask {
  unitId: string;
  hanziId: string;
  capability: "recognition" | "meaning";
  teaches: false;
}

export function buildHanziDiagnostic(progress: HanziProgressMap, grade: Grade): HanziDiagnosticTask[] {
  const limit = Math.min(6, getHanziDomainAdapter(grade).maxNewItems + 3);
  return HANZI_UNITS.flatMap((unit) => {
    const char = unit.teachingOrder.find((candidate) => {
      const item = HANZI_CATALOG.find((entry) => entry.char === candidate);
      return item && !progress[item.id];
    });
    const item = char ? HANZI_CATALOG.find((entry) => entry.char === char) : undefined;
    return item ? [{ unitId: unit.id, hanziId: item.id, capability: "recognition" as const, teaches: false as const }] : [];
  }).slice(0, limit);
}

export function resolveHanziStartingUnit(progress: HanziProgressMap, now = Date.now()): HanziCurriculumUnit {
  return HANZI_UNITS.find((unit) => unit.recognizeChars.some((char) => {
    const item = HANZI_CATALOG.find((candidate) => candidate.char === char);
    return !item || getHanziStatus(progress[item.id], now) !== "known";
  })) ?? HANZI_UNITS[HANZI_UNITS.length - 1];
}
