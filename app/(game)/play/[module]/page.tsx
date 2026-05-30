"use client";

import { use } from "react";
import { notFound, useRouter } from "next/navigation";
import { GameModal } from "@/components/GameModal";
import { MODULE_META, type ModuleId } from "@/lib/utils";
import { WritingGame } from "@/components/games/WritingGame";
import { AlphabetGame } from "@/components/games/AlphabetGame";
import { WordsGame } from "@/components/games/WordsGame";
import { MathGame } from "@/components/games/MathGame";
import { StoryGame } from "@/components/games/StoryGame";
import { useGameStore } from "@/store/gameStore";
import { useEffect } from "react";

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
  const bumpStars = useGameStore((s) => s.bumpStars);

  useEffect(() => {
    if (!child) router.replace("/child-select");
  }, [child, router]);

  if (!moduleId) return notFound();
  if (!child) return null;

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
        }),
      });
    } catch {
      // 网络错误：忽略，下次会话补传机制可后续加
    }
  };

  return (
    <GameModal title={meta.label} emoji={meta.emoji} color={meta.color} onClose={back}>
      {slug === "writing" && <WritingGame onComplete={onSessionComplete} onExit={back} />}
      {slug === "alphabet" && <AlphabetGame onComplete={onSessionComplete} onExit={back} />}
      {slug === "words" && <WordsGame onComplete={onSessionComplete} onExit={back} />}
      {slug === "math" && <MathGame onComplete={onSessionComplete} onExit={back} />}
      {slug === "story" && <StoryGame onComplete={onSessionComplete} onExit={back} />}
    </GameModal>
  );
}
