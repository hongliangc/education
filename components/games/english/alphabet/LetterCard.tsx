"use client";

import { useEffect, useRef } from "react";
import type { AlphabetEntry } from "@/content/english/alphabet";
import { speakSequence, stopSpeaking, type SpeechController } from "@/lib/speech";
import { SpeakPanel } from "../SpeakPanel";

export function LetterCard({
  entry,
  feedback,
  disabled,
  onSpoken,
}: {
  entry: AlphabetEntry;
  feedback: "correct" | "retry" | "soft" | null;
  disabled: boolean;
  onSpoken: (transcript: string | null) => void;
}) {
  const speechRef = useRef<SpeechController | null>(null);

  // 「听一遍」分三段示范，段间留明显停顿：字母名 → 自然拼读音 → 例词（ay … a … apple）。
  const playDemo = () =>
    speakSequence(
      [
        { text: entry.name, rate: 0.8 },
        { text: entry.soundSay, rate: 0.7 },
        { text: entry.word, rate: 0.85 },
      ],
      { lang: "en-US", gapMs: 480 },
    );

  useEffect(() => {
    speechRef.current?.stop();
    speechRef.current = playDemo();
    return () => {
      speechRef.current?.stop();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  return (
    <div className="text-center">
      <div className="anim-pop-in mx-auto mt-4 max-w-xs rounded-3xl bg-gradient-to-br from-amber-50 to-orange-100 px-6 py-6 shadow ring-2 ring-amber-200">
        <div className="text-7xl font-black text-orange-600">
          {entry.letter}
          <span className="text-5xl text-amber-500">{entry.lower}</span>
        </div>
        <div className="mt-2 font-mono text-2xl font-black text-rose-500">{entry.soundIpa}</div>
        <div className="mt-3 text-6xl">{entry.emoji}</div>
        <div className="mt-1 text-3xl font-black text-slate-800">{entry.word}</div>
      </div>

      <p className="mt-3 text-sm font-bold text-slate-500">
        字母名 {entry.letter} · 字母音 {entry.soundIpa} · 例词 {entry.word}
      </p>

      <div className="mt-4">
        <SpeakPanel
          say={entry.word}
          onListen={playDemo}
          onSpoken={onSpoken}
          disabled={disabled}
        />
      </div>

      <div className="mt-3 h-6 text-base font-bold" aria-live="polite">
        {feedback === "correct" ? <span className="text-emerald-500">读得真棒！🎉</span> : null}
        {feedback === "retry" ? <span className="text-amber-500">再听一次，慢慢读～ 🔁</span> : null}
        {feedback === "soft" ? <span className="text-sky-500">很好，我们继续！👍</span> : null}
      </div>
    </div>
  );
}
