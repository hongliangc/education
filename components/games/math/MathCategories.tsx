"use client";

import { useCallback, useEffect, useState } from "react";
import { Btn } from "@/components/Btn";
import {
  MATH_CATEGORIES,
  mistakesForCategory,
  type MathCategory,
} from "@/content/math/categories";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { getMistakes, mistakeToProblem, type MathMistake } from "@/lib/math/mistakes";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { MathLesson } from "./MathLesson";
import { MathRound } from "./MathRound";
import { showFairyGuide } from "@/lib/fairy-guide";

interface ReviewState {
  category: MathCategory;
  problems: ReturnType<typeof mistakeToProblem>[];
  correctQ: number | null;
}

export function MathCategories({
  childId,
  grade,
  onComplete,
  onExit,
  onPath,
  onClassic,
}: {
  childId: string;
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
  onPath: () => void;
  onClassic: () => void;
}) {
  const [mistakes, setMistakes] = useState<MathMistake[]>([]);
  const [activeCategory, setActiveCategory] = useState<MathCategory | null>(null);
  const [review, setReview] = useState<ReviewState | null>(null);

  const refresh = useCallback(() => {
    setMistakes(getMistakes(childId));
  }, [childId]);

  useEffect(() => {
    refresh();
    showFairyGuide({
      event: "enter",
      text: `推荐先走“${GRADE_LABELS[grade]}按年级闯关”，一步一步学习今天的数学。`,
      autoHideMs: 6500,
    });
  }, [grade, refresh]);

  if (activeCategory) {
    return (
      <MathLesson
        lesson={activeCategory}
        childId={childId}
        onComplete={onComplete}
        onMistakesChanged={refresh}
        onExit={() => {
          setActiveCategory(null);
          refresh();
        }}
      />
    );
  }

  if (review) {
    if (review.correctQ === null) {
      return (
        <MathRound
          childId={childId}
          problems={review.problems}
          review
          onMistakesChanged={refresh}
          onFinish={(correctQ) => {
            setReview((current) => (current ? { ...current, correctQ } : null));
          }}
        />
      );
    }

    const stars = Math.max(
      1,
      Math.round((review.correctQ / review.problems.length) * 3),
    );
    return (
      <GameDone
        starsEarned={stars}
        correctQ={review.correctQ}
        totalQ={review.problems.length}
        onAgain={() => {
          const problems = mistakesForCategory(review.category, getMistakes(childId)).map(
            mistakeToProblem,
          );
          if (problems.length === 0) {
            setReview(null);
            refresh();
            return;
          }
          setReview({ ...review, problems, correctQ: null });
        }}
        onClose={() => {
          setReview(null);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="anim-pop-in">
      <div className="mb-5 text-center">
        <h3 className="mt-2 text-2xl font-bold text-slate-700">今天想学什么？</h3>
        <p className="mt-1 text-sm font-bold text-indigo-600">
          {GRADE_LABELS[grade]} · 推荐从年级路线开始
        </p>
        <Btn variant="primary" className="mt-4 w-full py-4 text-lg" onClick={onPath}>
          按年级闯关
        </Btn>
      </div>

      <h4 className="mb-3 font-black text-slate-700">或选择专项练习</h4>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {MATH_CATEGORIES.map((category) => {
          const categoryMistakes = mistakesForCategory(category, mistakes);
          return (
            <div
              key={category.key}
              className="rounded-3xl bg-gradient-to-br from-sky-50 to-violet-100 p-3 ring-1 ring-indigo-200"
            >
              <Btn
                variant="ghost"
                className="w-full flex-col bg-white/80 px-4 py-5 text-center"
                ariaLabel={`学习${category.title}`}
                onClick={() => setActiveCategory(category)}
              >
                <span className="text-4xl">{category.icon}</span>
                <span className="text-lg text-slate-700">{category.title}</span>
                <span className="text-sm font-medium leading-relaxed text-slate-500">
                  {category.concept}
                </span>
              </Btn>
              {categoryMistakes.length > 0 ? (
                <Btn
                  size="sm"
                  variant="danger"
                  className="mt-3 w-full"
                  onClick={() =>
                    setReview({
                      category,
                      problems: categoryMistakes.map(mistakeToProblem),
                      correctQ: null,
                    })
                  }
                >
                  📕 错题 {categoryMistakes.length}
                </Btn>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Btn variant="ghost" onClick={onClassic}>
          🎯 综合练习
        </Btn>
        <Btn variant="ghost" onClick={onExit}>
          返回世界
        </Btn>
      </div>
    </div>
  );
}
