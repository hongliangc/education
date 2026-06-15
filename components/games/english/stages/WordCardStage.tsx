"use client";

import { useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import type { EnglishScene } from "@/content/english/scene";

// Step ① 看图识词 — meet the words. Each card auto-reads the word clearly; tapping replays it.
// Pure input, no scoring — it just primes the vocabulary.
export function WordCardStage({
  scene,
  onDone,
}: {
  scene: EnglishScene;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const word = scene.words[i];
  const speakRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  const say = (text: string) => {
    speakRef.current?.stop();
    speakRef.current = speakText(text, { lang: "en-US", rate: 0.85 });
  };

  // Read each card as it appears: just the word, clearly (no phonics decode read-aloud).
  useEffect(() => {
    say(word.en);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const next = () => {
    sfx.pageFlip();
    if (i + 1 >= scene.words.length) onDone();
    else setI((n) => n + 1);
  };

  const last = i + 1 >= scene.words.length;

  return (
    <div className="text-center">
      <p className="text-sm font-bold text-emerald-500">① 看图识词 · Meet the words</p>
      <button
        type="button"
        onClick={() => say(word.en)}
        className="anim-pop-in mx-auto mt-4 block rounded-3xl bg-white px-10 py-8 shadow ring-2 ring-emerald-100 transition active:scale-95"
        aria-label={`再听一次 ${word.en}`}
      >
        <span className="block text-7xl">{word.emoji}</span>
        <span className="mt-2 block text-3xl font-black text-slate-800">{word.en}</span>
        <span className="mt-1 block text-base text-slate-400">{word.zh}</span>
      </button>
      <p className="mt-2 text-xs text-slate-400">点卡片再听一次 🔊</p>

      <div className="mt-5 flex items-center justify-center gap-2">
        {scene.words.map((w, n) => (
          <span
            key={w.id}
            className={`h-2 w-2 rounded-full ${n <= i ? "bg-emerald-400" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <Btn className="mt-5" variant="secondary" onClick={next}>
        {last ? "去听音 →" : "下一个 →"}
      </Btn>
    </div>
  );
}
