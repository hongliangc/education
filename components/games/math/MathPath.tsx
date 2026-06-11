"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn } from "@/components/Btn";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "../types";
import { getMathCurriculum } from "@/content/math/curriculum";
import {
  fetchLessonProgress,
  isLessonUnlocked,
  saveLessonProgress,
  type LessonProgressMap,
} from "@/lib/lessonProgress";
import { MathLesson } from "./MathLesson";

// The grade's ordered lesson path. Tapping an unlocked lesson runs its guided flow; finishing
// records both a normal session (stars + module mastery, via onComplete) and per-lesson progress.
export function MathPath({
  childId,
  grade,
  onComplete,
  onReview,
}: {
  childId: string;
  grade: Grade;
  onComplete: OnComplete;
  onReview: () => void;
}) {
  const lessons = getMathCurriculum(grade) ?? [];
  const [progress, setProgress] = useState<LessonProgressMap>({});
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void fetchLessonProgress(childId, "MATH", grade).then(setProgress);
  }, [childId, grade]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const orderedKeys = lessons.map((l) => l.key);
  const active = lessons.find((l) => l.key === activeKey) ?? null;

  if (active) {
    return (
      <MathLesson
        lesson={active}
        childId={childId}
        onMistakesChanged={() => {}}
        onComplete={(result) => {
          onComplete(result);
          void saveLessonProgress(childId, {
            module: "MATH",
            grade,
            lessonKey: active.key,
            stars: result.starsEarned,
            masteryPct: result.totalQ ? Math.round((result.correctQ / result.totalQ) * 100) : 0,
          }).then(refresh);
        }}
        onExit={() => {
          setActiveKey(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">闯关学习 · 一步步来 🎯</p>
        <Btn variant="ghost" size="sm" onClick={onReview}>
          综合练习
        </Btn>
      </div>
      <div className="space-y-2">
        {lessons.map((lesson, i) => {
          const entry = progress[lesson.key];
          const unlocked = isLessonUnlocked(orderedKeys, progress, i);
          const done = Boolean(entry?.completed);
          return (
            <button
              key={lesson.key}
              onClick={() => unlocked && setActiveKey(lesson.key)}
              disabled={!unlocked}
              aria-label={lesson.title}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left ring-1 transition ${
                unlocked
                  ? "bg-white ring-amber-200 hover:bg-amber-50"
                  : "bg-slate-50 opacity-60 ring-slate-200"
              }`}
            >
              <span className="text-2xl">{!unlocked ? "🔒" : done ? "✅" : lesson.icon}</span>
              <span className="flex-1 font-bold text-slate-700">
                第 {lesson.order} 节 · {lesson.title}
              </span>
              <span className="shrink-0 text-amber-400">
                {entry && entry.stars > 0
                  ? Array.from({ length: 3 })
                      .map((_, s) => (s < entry.stars ? "★" : "☆"))
                      .join("")
                  : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
