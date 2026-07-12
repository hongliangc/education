"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  recordIdiomResult,
  recordIdiomAnswer,
  recordIdiomExplanation,
  type IdiomProgressMap,
  type IdiomProgressOutcome,
} from "@/content/hanzi";

const STORAGE_PREFIX = "mlk-hanzi-idiom-progress";

export function useHanziIdiomProgress(childId: string) {
  const storageKey = `${STORAGE_PREFIX}:${childId}`;
  const [progress, setProgress] = useState<IdiomProgressMap>(() => readProgress(storageKey));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(progress));
    } catch {
      // Local storage can be unavailable in private browsing; progress stays in memory.
    }
  }, [progress, storageKey]);

  const recordResult = useCallback((idiomId: string, outcome: IdiomProgressOutcome) => {
    setProgress((current) => recordIdiomResult(current, idiomId, outcome));
  }, []);
  const recordAnswer = useCallback((idiomId: string, correct: boolean) => setProgress((current) => recordIdiomAnswer(current, idiomId, correct)), []);
  const recordExplanation = useCallback((idiomId: string) => setProgress((current) => recordIdiomExplanation(current, idiomId)), []);

  return useMemo(() => ({ progress, recordResult, recordAnswer, recordExplanation }), [progress, recordResult, recordAnswer, recordExplanation]);
}

function readProgress(storageKey: string): IdiomProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw) as IdiomProgressMap;
  } catch {
    return {};
  }
}
