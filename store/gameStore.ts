"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Grade } from "@/lib/grades";

export interface ChildSummary {
  id: string;
  name: string;
  age: number;
  avatar: string;
  fairyLevel: number;
  totalStars: number;
  hearts: number;
  streakDays: number;
  // null until the parent confirms the child's grade in child-select.
  gradeLevel: Grade | null;
}

interface GameState {
  activeChild: ChildSummary | null;
  setActiveChild: (c: ChildSummary | null) => void;
  setActiveChildGrade: (grade: Grade) => void;
  bumpStars: (n: number) => void;
  setStars: (total: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      activeChild: null,
      setActiveChild: (c) => set({ activeChild: c }),
      setActiveChildGrade: (grade) =>
        set((s) =>
          s.activeChild ? { activeChild: { ...s.activeChild, gradeLevel: grade } } : s,
        ),
      bumpStars: (n) =>
        set((s) =>
          s.activeChild
            ? { activeChild: { ...s.activeChild, totalStars: s.activeChild.totalStars + n } }
            : s,
        ),
      setStars: (total) =>
        set((s) =>
          s.activeChild
            ? { activeChild: { ...s.activeChild, totalStars: Math.max(0, Math.floor(total)) } }
            : s,
        ),
    }),
    { name: "mlk-game-store" },
  ),
);
