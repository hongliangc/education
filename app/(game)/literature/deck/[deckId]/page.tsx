// app/(game)/literature/deck/[deckId]/page.tsx
// 名句卡翻看页：每张卡当场答一题，按答对数量得星（结算逻辑在 QuoteDeckPlayer）。
"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { BackButton } from "@/components/BackButton";
import { Btn } from "@/components/Btn";
import { getDeck } from "@/content/classics";
import type { SessionResult } from "@/components/games/types";
import { QuoteDeckPlayer } from "@/components/games/literature/QuoteDeckPlayer";

export default function DeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const bumpStars = useGameStore((s) => s.bumpStars);
  const deck = getDeck(deckId);

  useEffect(() => {
    if (!child) router.replace("/child-select");
  }, [child, router]);

  if (!child) return null;
  if (!deck) {
    return (
      <main className="min-h-screen pt-20 px-4">
        <div className="max-w-md mx-auto rounded-3xl bg-white/85 p-6 text-center">
          <div className="text-4xl">📭</div>
          <p className="mt-2 font-bold text-slate-700">找不到这组名句卡</p>
          <Btn
            variant="primary"
            className="mt-4"
            onClick={() => router.push("/literature")}
          >
            回诸子智慧
          </Btn>
        </div>
      </main>
    );
  }

  const onComplete = async (r: SessionResult) => {
    bumpStars(r.starsEarned);
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId: child.id, module: "LITERATURE", ...r }),
      });
    } catch {
      // 网络失败：本地星星已加，不阻断
    }
    router.push("/literature");
  };

  return (
    <main className="min-h-screen pt-20 px-4 pb-10">
      <div className="max-w-2xl mx-auto">
        <BackButton
          label="诸子智慧"
          className="mb-3"
          onClick={() => router.push("/literature")}
        />
        <div className="rounded-[2rem] bg-[#fffdf7] p-4 shadow-xl ring-2 ring-emerald-100 sm:p-6">
          <QuoteDeckPlayer
            deck={deck}
            onComplete={onComplete}
          />
        </div>
      </div>
    </main>
  );
}
