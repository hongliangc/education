"use client";

import { useCallback, useEffect, useRef } from "react";
import { interruptBgm } from "@/components/audio/useBgm";

export function useRecordingAudioGuard(): {
  interrupt: () => void;
  restore: () => void;
} {
  const restoreRef = useRef<(() => void) | null>(null);

  const restore = useCallback(() => {
    restoreRef.current?.();
    restoreRef.current = null;
  }, []);

  const interrupt = useCallback(() => {
    restoreRef.current ??= interruptBgm();
  }, []);

  useEffect(() => restore, [restore]);

  return { interrupt, restore };
}
