// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG } from "./catalog.ts";
import type { HanziProgressEntry, HanziProgressMap } from "./progress.ts";

export interface HanziProgressStoreV2 {
  version: 2;
  entries: HanziProgressMap;
  unmapped: Record<string, HanziProgressEntry>;
}

export function migrateHanziProgress(value: unknown): HanziProgressStoreV2 {
  if (isVersionedStore(value)) return value;

  const knownChars = new Set(HANZI_CATALOG.map((item) => item.char));
  const entries: HanziProgressMap = {};
  const unmapped: Record<string, HanziProgressEntry> = {};
  if (!value || typeof value !== "object") return { version: 2, entries, unmapped };

  for (const [legacyId, candidate] of Object.entries(value)) {
    if (!isProgressEntry(candidate)) continue;
    const char = stableChar(legacyId);
    if (!char || !knownChars.has(char)) {
      unmapped[legacyId] = candidate;
      continue;
    }
    const stableId = `hanzi:${char}`;
    entries[stableId] = entries[stableId] ? mergeEntries(entries[stableId], candidate) : candidate;
  }
  return { version: 2, entries, unmapped };
}

function stableChar(id: string): string | undefined {
  if (id.startsWith("hanzi:")) return id.slice("hanzi:".length);
  const separator = id.indexOf("-");
  return separator >= 0 ? id.slice(separator + 1) : undefined;
}

function mergeEntries(left: HanziProgressEntry, right: HanziProgressEntry): HanziProgressEntry {
  const reviewDates = [left.nextReviewAt, right.nextReviewAt].filter((date): date is number => typeof date === "number");
  const correctStreak = Math.min(left.correctStreak, right.correctStreak);
  return {
    attempts: Math.max(left.attempts, right.attempts),
    correctStreak,
    lastPracticedAt: Math.max(left.lastPracticedAt, right.lastPracticedAt),
    explainCount: Math.max(left.explainCount ?? 0, right.explainCount ?? 0),
    stage: correctStreak >= 3 ? "mastered" : "learning",
    ...(reviewDates.length > 0 ? { nextReviewAt: Math.min(...reviewDates) } : {}),
  };
}

function isVersionedStore(value: unknown): value is HanziProgressStoreV2 {
  return Boolean(
    value
      && typeof value === "object"
      && "version" in value
      && value.version === 2
      && "entries" in value
      && value.entries
      && typeof value.entries === "object"
      && "unmapped" in value
      && value.unmapped
      && typeof value.unmapped === "object",
  );
}

function isProgressEntry(value: unknown): value is HanziProgressEntry {
  return Boolean(
    value
      && typeof value === "object"
      && "attempts" in value
      && typeof value.attempts === "number"
      && "correctStreak" in value
      && typeof value.correctStreak === "number"
      && "lastPracticedAt" in value
      && typeof value.lastPracticedAt === "number",
  );
}
