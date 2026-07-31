"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/gameStore";

export function GameStoreGate({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persist = useGameStore.persist;
    if (persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated ? children : null;
}
