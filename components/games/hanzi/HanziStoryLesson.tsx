"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import type { HanziItem } from "@/content/hanzi";
import { speakTextStream, type SpeechController } from "@/lib/speech";
import { HanziScreenHeader } from "./HanziScreenHeader";

export function HanziStoryLesson({ item, onBack }: { item: HanziItem; onBack: () => void }) {
  const [playing, setPlaying] = useState(false);
  const speechRef = useRef<SpeechController | null>(null);

  const stop = () => {
    speechRef.current?.stop();
    speechRef.current = null;
    setPlaying(false);
  };

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      speechRef.current = null;
    };
  }, []);

  const play = () => {
    stop();
    setPlaying(true);
    speechRef.current = speakTextStream(`${item.char}，${item.pinyin}。${item.story}`, {
      lang: "zh-CN",
      rate: 0.85,
      onEnd: () => {
        speechRef.current = null;
        setPlaying(false);
      },
    });
  };

  return (
    <section className="h-[min(94vh,64rem)] space-y-5 overflow-y-auto bg-[#fffdf9] p-4 text-center sm:p-6">
      <HanziScreenHeader title={`${item.char}的小故事`} subtitle="听故事 · 说一说" onBack={() => { stop(); onBack(); }} />
      <div className="rounded-[2rem] bg-violet-50 p-6 ring-1 ring-violet-100">
        <div className="text-7xl font-black text-slate-800">{item.char}</div>
        <div className="mt-1 text-xl font-black text-pink-500">{item.pinyin}</div>
        <p className="mt-5 rounded-3xl bg-white p-5 text-left text-base font-bold leading-8 text-slate-600">
          {item.story}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Btn onClick={playing ? stop : play}>{playing ? "⏹ 停止" : "▶ 听故事"}</Btn>
          <Btn variant="secondary" onClick={play}>再听一次</Btn>
        </div>
      </div>
    </section>
  );
}
