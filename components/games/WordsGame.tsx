"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { generateRound, type GradedWord } from "@/content/words";
import { shuffle } from "@/lib/utils";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

const ROUND_SIZE = 4;

export function WordsGame({
  grade,
  onComplete,
  onExit,
}: {
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [round, setRound] = useState<GradedWord[]>(() => generateRound(grade, ROUND_SIZE));
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const gradeRef = useRef(grade);

  const emojiOrder = useMemo(() => shuffle(round), [round]);

  const restart = useCallback(() => {
    setRound(generateRound(grade, ROUND_SIZE));
    setMatched(new Set());
    setSelectedId(null);
    setFlash(null);
    setWrongCount(0);
    setDone(false);
    startedAt.current = Date.now();
  }, [grade]);

  // Restart with fresh content whenever the parent switches the practice grade.
  useEffect(() => {
    if (gradeRef.current !== grade) {
      gradeRef.current = grade;
      restart();
    }
  }, [grade, restart]);

  if (done) {
    const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1;
    return (
      <GameDone
        starsEarned={stars}
        correctQ={round.length}
        totalQ={round.length}
        onAgain={restart}
        onClose={onExit}
      />
    );
  }

  const onPickZh = (w: GradedWord) => {
    if (matched.has(w.id)) return;
    sfx.click();
    setSelectedId(w.id);
    speakText(w.zh, { lang: "zh-CN" });
  };

  const onPickEmoji = (w: GradedWord) => {
    if (matched.has(w.id)) return;
    if (!selectedId) {
      sfx.click();
      return;
    }
    const ok = selectedId === w.id;
    setFlash({ id: w.id, ok });
    if (ok) {
      sfx.coin();
      const next = new Set(matched);
      next.add(w.id);
      setMatched(next);
      setSelectedId(null);
      if (next.size >= round.length) {
        const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1;
        onComplete({
          score: Math.max(0, 100 - wrongCount * 10),
          totalQ: round.length,
          correctQ: round.length,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
          starsEarned: stars,
        });
        setTimeout(() => setDone(true), 350);
      }
    } else {
      sfx.wrong();
      setWrongCount((c) => c + 1);
      setSelectedId(null);
    }
    setTimeout(() => setFlash(null), 500);
  };

  return (
    <div>
      <p className="text-center text-slate-600 mb-4">
        点击中文词，再点出对应的图片 🔍
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {round.map((w) => {
            const isSelected = selectedId === w.id;
            const isMatched = matched.has(w.id);
            return (
              <button
                key={`zh-${w.id}`}
                onClick={() => onPickZh(w)}
                disabled={isMatched}
                aria-label={`配对：${w.zh}`}
                className={`w-full py-4 rounded-2xl text-xl font-bold transition shadow ${
                  isMatched
                    ? "bg-emerald-100 text-emerald-700 line-through opacity-70"
                    : isSelected
                    ? "bg-pink-400 text-white ring-4 ring-pink-200 scale-105"
                    : "bg-white ring-2 ring-pink-200 text-slate-700 hover:bg-pink-50"
                } ${flash?.id === w.id && !flash.ok ? "anim-shake" : ""}`}
              >
                {w.zh}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {emojiOrder.map((w) => {
            const isMatched = matched.has(w.id);
            const showOk = flash?.id === w.id && flash.ok;
            return (
              <button
                key={`em-${w.id}`}
                onClick={() => onPickEmoji(w)}
                disabled={isMatched}
                aria-label={`图：${w.emoji} 代表 ${w.zh}`}
                className={`w-full py-4 rounded-2xl text-5xl transition shadow ${
                  isMatched
                    ? "bg-emerald-100 opacity-70"
                    : "bg-white ring-2 ring-sky-200 hover:bg-sky-50"
                } ${showOk ? "anim-correct" : ""}`}
              >
                {w.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-slate-400">
        已配对 {matched.size} / {round.length}
      </p>
    </div>
  );
}
