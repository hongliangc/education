// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG, type HanziItem } from "./catalog.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziUnit } from "./curriculum.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziDomainAdapter } from "./domain-adapter.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziStatus, type HanziProgressMap } from "./progress.ts";
import type { Grade } from "../../lib/grades.ts";

export type HanziSessionReason = "practice" | "review" | "new";
export type HanziSelectionMode = "mainline" | "free-practice";

export interface HanziSessionItem {
  item: HanziItem;
  reason: HanziSessionReason;
}

export interface HanziSession {
  unitId: string;
  selectionMode: HanziSelectionMode;
  advancesMainline: boolean;
  items: HanziSessionItem[];
  distractorPool: HanziItem[];
}

export function buildHanziSession({
  unitId,
  selectedIds,
  selectionMode = "mainline",
  progress,
  grade,
  now = Date.now(),
  rng = Math.random,
}: {
  unitId: string;
  selectedIds: readonly string[];
  selectionMode?: HanziSelectionMode;
  progress: HanziProgressMap;
  grade: Grade;
  now?: number;
  rng?: () => number;
}): HanziSession {
  const unit = getHanziUnitById(unitId);
  const selected = new Set(selectedIds);
  const orderedItems = selectionMode === "free-practice" && selected.size > 0
    ? HANZI_CATALOG.filter((item) => selected.has(item.id))
    : unit.teachingOrder.flatMap((char) => {
        const item = HANZI_CATALOG.find((candidate) => candidate.char === char);
        return item ? [item] : [];
      });
  const practice = orderedItems.filter((item) => Boolean(progress[item.id]) && getHanziStatus(progress[item.id], now) === "practice");
  const review = orderedItems.filter((item) => getHanziStatus(progress[item.id], now) === "review");
  const knownIds = new Set(orderedItems.filter((item) => getHanziStatus(progress[item.id], now) === "known").map((item) => item.id));
  const maxNewItems = getHanziDomainAdapter(grade).maxNewItems;
  const fresh = orderedItems.filter((item) => !progress[item.id] && !knownIds.has(item.id)).slice(0, maxNewItems);
  const items: HanziSessionItem[] = [
    ...shuffled(practice, rng).map((item) => ({ item, reason: "practice" as const })),
    ...shuffled(review, rng).map((item) => ({ item, reason: "review" as const })),
    ...fresh.map((item) => ({ item, reason: "new" as const })),
  ];
  const learnedIds = new Set(Object.keys(progress));
  const distractorPool = HANZI_CATALOG.filter((item) => orderedItems.some((answer) => answer.id === item.id) || learnedIds.has(item.id));
  return { unitId, selectionMode, advancesMainline: selectionMode === "mainline", items, distractorPool };
}

function getHanziUnitById(unitId: string) {
  const representative = HANZI_CATALOG.find((item) => getHanziUnit(item.char)?.id === unitId);
  const unit = representative ? getHanziUnit(representative.char) : undefined;
  if (!unit) throw new Error(`Unknown Hanzi unit: ${unitId}`);
  return unit;
}

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(rng() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}
