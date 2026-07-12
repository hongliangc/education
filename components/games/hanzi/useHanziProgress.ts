"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  migrateHanziProgress,
  recordHanziResult,
  recordHanziExplanation,
  type HanziProgressMap,
} from "@/content/hanzi";

const STORAGE_PREFIX = "mlk-hanzi-progress";

export function useHanziProgress(childId: string) {
  const storageKey = `${STORAGE_PREFIX}:${childId}`;
  const [progress, setProgress] = useState<HanziProgressMap>(() => readProgress(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);

  useEffect(() => {
    setProgress(readProgress(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (loadedKey !== storageKey) return;
    const current = migrateHanziProgress(parseStoredValue(window.localStorage.getItem(storageKey)));
    window.localStorage.setItem(storageKey, JSON.stringify({ version: 2, entries: progress, unmapped: current.unmapped }));
  }, [loadedKey, progress, storageKey]);

  const recordResult = useCallback((hanziId: string, correct: boolean) => {
    setProgress((current) => recordHanziResult(current, hanziId, correct));
  }, []);
  const recordExplanation = useCallback((hanziId: string) => {
    setProgress((current) => recordHanziExplanation(current, hanziId));
  }, []);

  return useMemo(() => ({ progress, recordResult, recordExplanation }), [progress, recordResult, recordExplanation]);
}

function readProgress(storageKey: string): HanziProgressMap {
  if (typeof window === "undefined") return {};
  try {
    return migrateHanziProgress(parseStoredValue(window.localStorage.getItem(storageKey))).entries;
  } catch {
    return {};
  }
}

function parseStoredValue(value: string | null): unknown {
  if (!value) return {};
  return JSON.parse(value) as unknown;
}
