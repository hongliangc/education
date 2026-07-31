"use client";

import { useEffect, useState } from "react";

export function useVisualQa(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(window.location.search.includes("visual=1"));
  }, []);

  return enabled;
}
