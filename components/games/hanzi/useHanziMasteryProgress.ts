"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  recordHanziEvidence,
  type HanziEvidenceInput,
  type HanziMasteryMap,
} from "@/content/hanzi";

const STORAGE_PREFIX = "mlk-hanzi-mastery";

export function useHanziMasteryProgress(childId: string) {
  const storageKey = `${STORAGE_PREFIX}:${childId}`;
  const [progress, setProgress] = useState<HanziMasteryMap>(() => readProgress(storageKey));
  const [loadedKey, setLoadedKey] = useState(storageKey);

  useEffect(() => {
    setProgress(readProgress(storageKey));
    setLoadedKey(storageKey);
  }, [storageKey]);
  useEffect(() => {
    if (loadedKey !== storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(progress));
  }, [loadedKey, progress, storageKey]);

  const recordEvidence = useCallback((hanziId: string, input: Omit<HanziEvidenceInput, "assessedAt">) => {
    setProgress((current) => recordHanziEvidence(current, hanziId, { ...input, assessedAt: Date.now() }));
  }, []);

  return useMemo(() => ({ progress, recordEvidence }), [progress, recordEvidence]);
}

function readProgress(storageKey: string): HanziMasteryMap {
  if (typeof window === "undefined") return {};
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "{}") as unknown;
    return value && typeof value === "object" ? value as HanziMasteryMap : {};
  } catch {
    return {};
  }
}
