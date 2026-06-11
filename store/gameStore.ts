"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { clampToAllowedGrade, resolveChildGrade, type Grade } from "@/lib/grades";

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
  // Transient practice grade chosen from the HUD; never persisted, so a reload reverts to the
  // child's profile grade. `null` means "follow the child's profile grade".
  activeGrade: Grade | null;
  setActiveChild: (c: ChildSummary | null) => void;
  setActiveChildGrade: (grade: Grade) => void;
  setActiveGrade: (grade: Grade) => void;
  bumpStars: (n: number) => void;
  setStars: (total: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      activeChild: null,
      activeGrade: null,
      // Switching child resets the practice grade back to that child's profile grade.
      setActiveChild: (c) => set({ activeChild: c, activeGrade: null }),
      setActiveChildGrade: (grade) =>
        set((s) =>
          s.activeChild ? { activeChild: { ...s.activeChild, gradeLevel: grade } } : s,
        ),
      setActiveGrade: (grade) =>
        set((s) =>
          s.activeChild
            ? { activeGrade: clampToAllowedGrade(resolveChildGrade(s.activeChild), grade) }
            : s,
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
    // Only the active child is persisted; the transient practice grade is intentionally left out.
    { name: "mlk-game-store", partialize: (s) => ({ activeChild: s.activeChild }) },
  ),
);
