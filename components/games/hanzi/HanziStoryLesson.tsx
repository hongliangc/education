"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import type { HanziItem } from "@/content/hanzi";
import { speakTextStream, type SpeechController } from "@/lib/speech";
import { HanziShell } from "./HanziShell";

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
    <HanziShell title={`${item.char}的小故事`} subtitle="听故事 · 说一说" onBack={() => { stop(); onBack(); }}>
      <div className="mx-auto max-w-3xl rounded-[2rem] border-2 border-[#e2c48c] bg-[#fffaf0] p-5 text-center shadow-[0_6px_0_#cfad70] sm:p-8">
        <div className="mx-auto grid size-44 place-items-center rounded-[2rem] border-2 border-[#d7c7ef] bg-[#f5edff] text-8xl font-black text-[#17365f]">{item.char}</div>
        <div className="mt-2 text-2xl font-black text-[#e64c88]">{item.pinyin}</div>
        <p className="mt-5 rounded-3xl border border-[#eadcc2] bg-white p-5 text-left text-base font-bold leading-8 text-[#57483f]">
          {item.story}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Btn onClick={playing ? stop : play}>{playing ? "⏹ 停止" : "▶ 听故事"}</Btn>
          <Btn variant="secondary" onClick={play}>再听一次</Btn>
        </div>
      </div>
    </HanziShell>
  );
}
