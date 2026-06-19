"use client";

import { useEffect, useRef } from "react";
import { speakEnglishSequence, stopSpeaking, type SpeechController } from "@/lib/speech";

export function ExampleChainButton({ words }: { words: readonly string[] }) {
  const speechRef = useRef<SpeechController | null>(null);

  useEffect(
    () => () => {
      speechRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const speakWords = () => {
    speechRef.current?.stop();
    speechRef.current = speakEnglishSequence(
      words.map((w) => ({ text: w })),
      { rate: 0.82, gapMs: 260 },
    );
  };

  return (
    <button
      type="button"
      onClick={speakWords}
      className="rounded-full bg-sky-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-sky-600"
    >
      🔊 整组连读
    </button>
  );
}
