"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ChildSummary {
  id: string;
  name: string;
  age: number;
  avatar: string;
  fairyLevel: number;
  totalStars: number;
  hearts: number;
  streakDays: number;
}

interface GameState {
  activeChild: ChildSummary | null;
  setActiveChild: (c: ChildSummary | null) => void;
  bumpStars: (n: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      activeChild: null,
      setActiveChild: (c) => set({ activeChild: c }),
      bumpStars: (n) =>
        set((s) =>
          s.activeChild
            ? { activeChild: { ...s.activeChild, totalStars: s.activeChild.totalStars + n } }
            : s,
        ),
    }),
    { name: "mlk-game-store" },
  ),
);
