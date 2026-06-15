"use client";

import { useEffect, useRef } from "react";
import type { GroupInfo } from "@/content/english/ipa";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";

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
    speechRef.current = speakText(words.join(", "), { lang: "en-US", rate: 0.82 });
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

export function GroupChant({
  info,
  words,
}: {
  info: GroupInfo;
  words: readonly string[];
}) {
  const speechRef = useRef<SpeechController | null>(null);

  useEffect(
    () => () => {
      speechRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const speakChant = () => {
    speechRef.current?.stop();
    speechRef.current = speakText(info.chant, { lang: "zh-CN", rate: 0.9 });
  };

  return (
    <section className="mt-4 rounded-3xl bg-gradient-to-r from-violet-50 to-sky-50 p-4 ring-2 ring-violet-100">
      <div className="text-xs font-black tracking-wider text-violet-500">本组记忆口诀</div>
      <p className="mt-1 text-lg font-black text-slate-700">{info.chant}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={speakChant}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-violet-600"
        >
          🔊 念口诀
        </button>
        <ExampleChainButton words={words} />
      </div>
    </section>
  );
}
