"use client";

import { use, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { GameModal } from "@/components/GameModal";
import { MODULE_META, type ModuleId } from "@/lib/utils";
import { WritingGame } from "@/components/games/WritingGame";
import { AlphabetGame } from "@/components/games/AlphabetGame";
import { WordsGame } from "@/components/games/WordsGame";
import { MathGame } from "@/components/games/MathGame";
import { MathCategories } from "@/components/games/math/MathCategories";
import { MathPath } from "@/components/games/math/MathPath";
import { getMathCurriculum } from "@/content/math/curriculum";
import { useGameStore } from "@/store/gameStore";
import { resolveChildGrade, type Grade } from "@/lib/grades";

// Math, alphabet, word matching and Hanzi learning generate grade-appropriate content.
const GRADE_AWARE = new Set<Slug>(["math", "alphabet", "words", "writing"]);

const SLUGS = {
  writing: "WRITING",
  alphabet: "ALPHABET",
  words: "WORDS",
  math: "MATH",
  story: "STORY",
} as const satisfies Record<string, ModuleId>;

type Slug = keyof typeof SLUGS;

export default function PlayPage({
  params,
}: {
  params: Promise<{ module: string }>;
}) {
  const router = useRouter();
  const { module } = use(params);
  const slug = module as Slug;
  const moduleId = SLUGS[slug];
  const child = useGameStore((s) => s.activeChild);
  const activeGrade = useGameStore((s) => s.activeGrade);
  const bumpStars = useGameStore((s) => s.bumpStars);

  // The practice grade comes from the shared HUD selector; before any switch it follows the
  // child's profile grade (inferred before confirmation).
  const grade: Grade = activeGrade ?? (child ? resolveChildGrade(child) : "K1");
  const gradeAware = GRADE_AWARE.has(slug);
  // Math opens by teaching content. The existing grade path and mixed round remain available
  // as secondary modes, including for grades without a guided curriculum.
  const mathHasPath = slug === "math" && getMathCurriculum(grade) !== null;
  const [mathMode, setMathMode] = useState<"categories" | "path" | "classic">("categories");

  useEffect(() => {
    if (!child) router.replace("/child-select");
  }, [child, router]);

  // 故事模块已迁移到全屏 /story（B1）；/play/story 重定向过去
  useEffect(() => {
    if (slug === "story") router.replace("/story");
  }, [slug, router]);

  if (!moduleId) return notFound();
  if (!child) return null;
  if (slug === "story") return null; // 已重定向到 /story

  const meta = MODULE_META[moduleId];
  const back = () => router.push("/world");

  const onSessionComplete = async (info: {
    score: number;
    totalQ: number;
    correctQ: number;
    durationSec: number;
    starsEarned: number;
  }) => {
    bumpStars(info.starsEarned);
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          childId: child.id,
          module: moduleId,
          ...info,
          ...(gradeAware ? { gradeLevel: grade } : {}),
        }),
      });
    } catch {
      // 网络错误：忽略，下次会话补传机制可后续加
    }
  };

  return (
    <GameModal title={meta.label} emoji={meta.emoji} color={meta.color} onClose={back}>
      {slug === "writing" && (
        <WritingGame grade={grade} onComplete={onSessionComplete} onExit={back} />
      )}
      {slug === "alphabet" && (
        <AlphabetGame grade={grade} onComplete={onSessionComplete} onExit={back} />
      )}
      {slug === "words" && (
        <WordsGame grade={grade} onComplete={onSessionComplete} onExit={back} />
      )}
      {slug === "math" &&
        (mathMode === "categories" ? (
          <MathCategories
            childId={child.id}
            grade={grade}
            onComplete={onSessionComplete}
            onExit={back}
            onPath={() => setMathMode(mathHasPath ? "path" : "classic")}
            onClassic={() => setMathMode("classic")}
          />
        ) : mathHasPath && mathMode === "path" ? (
          <MathPath
            childId={child.id}
            grade={grade}
            onComplete={onSessionComplete}
            onReview={() => setMathMode("categories")}
          />
        ) : (
          <MathGame
            childId={child.id}
            grade={grade}
            onComplete={onSessionComplete}
            onExit={() => setMathMode("categories")}
          />
        ))}
    </GameModal>
  );
}
