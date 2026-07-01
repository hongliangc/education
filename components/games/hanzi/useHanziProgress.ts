"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  recordHanziResult,
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
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [loadedKey, progress, storageKey]);

  const recordResult = useCallback((hanziId: string, correct: boolean) => {
    setProgress((current) => recordHanziResult(current, hanziId, correct));
  }, []);

  return useMemo(() => ({ progress, recordResult }), [progress, recordResult]);
}

function readProgress(storageKey: string): HanziProgressMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as HanziProgressMap;
  } catch {
    return {};
  }
}
