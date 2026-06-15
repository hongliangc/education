"use client";

import { useEffect, useRef, useState } from "react";
import type { Phoneme } from "@/content/english/ipa";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { SpeakPanel } from "../SpeakPanel";

export function PhonemeCard({
  phoneme,
  feedback,
  disabled,
  onSpoken,
}: {
  phoneme: Phoneme;
  feedback: "correct" | "retry" | "soft" | null;
  disabled: boolean;
  onSpoken: (transcript: string | null) => void;
}) {
  const [exampleIndex, setExampleIndex] = useState(0);
  const speechRef = useRef<SpeechController | null>(null);
  const activeExample = phoneme.examples[exampleIndex];
  const vowel = phoneme.kind === "vowel";

  // 进入音标卡 / 切音标：单独示范该音素的发音（不再直接读例词）。
  useEffect(() => {
    setExampleIndex(0);
    speechRef.current?.stop();
    speechRef.current = speakText(phoneme.say, { lang: "en-US", rate: 0.7 });
    return () => {
      speechRef.current?.stop();
      stopSpeaking();
    };
  }, [phoneme]);

  // 「🔊 听一遍」= 单独示范音素本身；例词改由 🍎 按钮单独朗读。
  const playSound = (): SpeechController => {
    speechRef.current?.stop();
    const controller = speakText(phoneme.say, { lang: "en-US", rate: 0.7 });
    speechRef.current = controller;
    return controller;
  };

  const playWord = () => {
    speechRef.current?.stop();
    speechRef.current = speakText(activeExample.word, { lang: "en-US", rate: 0.85 });
  };

  const speakAlliteration = () => {
    speechRef.current?.stop();
    speechRef.current = speakText(phoneme.alliteration, { lang: "en-US", rate: 0.85 });
  };

  return (
    <div className="text-center">
      <div
        className={`anim-pop-in mx-auto mt-4 max-w-xs rounded-3xl px-6 py-6 shadow ring-2 ${
          vowel
            ? "bg-gradient-to-br from-rose-50 to-amber-50 ring-rose-200"
            : "bg-gradient-to-br from-sky-50 to-indigo-50 ring-sky-200"
        }`}
      >
        <div className={`font-mono text-6xl font-black ${vowel ? "text-rose-600" : "text-sky-600"}`}>
          {phoneme.symbol}
        </div>
        <div className="mt-3 text-6xl">{activeExample.emoji}</div>
        <div className="mt-1 text-3xl font-black text-slate-800">{activeExample.word}</div>
        <div className="text-base font-bold text-slate-400">{activeExample.zh}</div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={playWord}
          className="rounded-full bg-amber-400 px-4 py-2 text-base font-black text-white shadow-sm ring-2 ring-amber-200 transition active:scale-95"
          aria-label={`听例词 ${activeExample.word}`}
        >
          🍎 听例词 · {activeExample.word}
        </button>
      </div>

      {phoneme.examples.length > 1 ? (
        <div className="mt-3 flex justify-center gap-2">
          {phoneme.examples.map((item, index) => (
            <button
              key={item.word}
              type="button"
              onClick={() => setExampleIndex(index)}
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                index === exampleIndex
                  ? vowel
                    ? "bg-rose-500 text-white"
                    : "bg-sky-500 text-white"
                  : "bg-white text-slate-500 ring-1 ring-slate-200"
              }`}
            >
              {item.emoji} {item.word}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mx-auto mt-4 max-w-md rounded-2xl bg-white p-3 text-left ring-1 ring-slate-200">
        <div className="flex items-center justify-between gap-3">
          <p className="font-black text-slate-700">{phoneme.alliteration}</p>
          <button
            type="button"
            onClick={speakAlliteration}
            className="shrink-0 rounded-full bg-emerald-500 px-3 py-2 text-sm font-black text-white shadow-sm"
            aria-label={`朗读记忆句：${phoneme.alliteration}`}
          >
            🔊 头韵句
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-400">🔊 听一遍 = 单独示范音标发音；🍎 = 听例词单词。</p>
      <div className="mt-3">
        <SpeakPanel
          say={activeExample.word}
          onListen={playSound}
          onSpoken={onSpoken}
          disabled={disabled}
        />
      </div>
      <div className="mt-3 h-6 text-base font-bold" aria-live="polite">
        {feedback === "correct" ? <span className="text-emerald-500">听得准，读得棒！🎉</span> : null}
        {feedback === "retry" ? <span className="text-amber-500">再听例词，试一次～ 🔁</span> : null}
        {feedback === "soft" ? <span className="text-sky-500">很好，我们继续！👍</span> : null}
      </div>
    </div>
  );
}
