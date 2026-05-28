"use client";

import { useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { WORDS, type WordPair } from "@/content/words";
import { shuffle } from "@/lib/utils";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

const ROUND_SIZE = 4;

export function WordsGame({ onComplete }: { onComplete: OnComplete }) {
  const [round, setRound] = useState<WordPair[]>(() => shuffle(WORDS).slice(0, ROUND_SIZE));
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [selectedZh, setSelectedZh] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ id: string; ok: boolean } | null>(null);
  const [wrongCount, setWrongCount] = useState(0);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const emojiOrder = useMemo(() => shuffle(round), [round]);

  if (done) {
    const correct = round.length;
    const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1;
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correct}
        totalQ={round.length}
        onAgain={() => {
          setRound(shuffle(WORDS).slice(0, ROUND_SIZE));
          setMatched(new Set());
          setSelectedZh(null);
          setWrongCount(0);
          setDone(false);
          startedAt.current = Date.now();
        }}
        onClose={() => undefined}
      />
    );
  }

  const onPickZh = (w: WordPair) => {
    if (matched.has(w.zh)) return;
    sfx.click();
    setSelectedZh(w.zh);
    speakText(w.zh, { lang: "zh-CN" });
  };

  const onPickEmoji = (w: WordPair) => {
    if (matched.has(w.zh)) return;
    if (!selectedZh) {
      sfx.click();
      return;
    }
    const ok = selectedZh === w.zh;
    setFlash({ id: w.zh, ok });
    if (ok) {
      sfx.coin();
      const next = new Set(matched);
      next.add(w.zh);
      setMatched(next);
      setSelectedZh(null);
      if (next.size >= round.length) {
        const stars = wrongCount === 0 ? 3 : wrongCount <= 2 ? 2 : 1;
        onComplete({
          score: 100 - wrongCount * 10,
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
      setSelectedZh(null);
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
            const isSelected = selectedZh === w.zh;
            const isMatched = matched.has(w.zh);
            return (
              <button
                key={`zh-${w.zh}`}
                onClick={() => onPickZh(w)}
                disabled={isMatched}
                className={`w-full py-4 rounded-2xl text-xl font-bold transition shadow ${
                  isMatched
                    ? "bg-emerald-100 text-emerald-700 line-through opacity-70"
                    : isSelected
                    ? "bg-pink-400 text-white ring-4 ring-pink-200 scale-105"
                    : "bg-white ring-2 ring-pink-200 text-slate-700 hover:bg-pink-50"
                } ${flash?.id === w.zh && !flash.ok ? "anim-shake" : ""}`}
              >
                {w.zh}
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          {emojiOrder.map((w) => {
            const isMatched = matched.has(w.zh);
            const showOk = flash?.id === w.zh && flash.ok;
            return (
              <button
                key={`em-${w.zh}`}
                onClick={() => onPickEmoji(w)}
                disabled={isMatched}
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
