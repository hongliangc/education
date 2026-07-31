"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import type { HanziItem } from "@/content/hanzi";
import { speakText, type SpeechController } from "@/lib/speech";
import { HanziShell } from "./HanziShell";

export function HanziDailyLesson({
  items,
  initialItemId,
  onLearned,
  onExplained,
  onPractice,
  onWriting,
  onBack,
}: {
  items: readonly HanziItem[];
  initialItemId?: string;
  onLearned: (id: string) => void;
  onExplained: (id: string) => void;
  onPractice: () => void;
  onWriting: () => void;
  onBack: () => void;
}) {
  const [index, setIndex] = useState(() => Math.max(0, items.findIndex((item) => item.id === initialItemId)));
  const [explained, setExplained] = useState(false);
  const speechRef = useRef<SpeechController | null>(null);
  const item = items[index];

  const stopSpeech = () => {
    speechRef.current?.stop();
    speechRef.current = null;
  };
  useEffect(() => stopSpeech, []);

  const listen = useCallback(() => {
    stopSpeech();
    if (!item) return;
    speechRef.current = speakText(
      `${item.char}。${item.meaning}。组词，${item.words.join("，")}。${item.story}`,
      { lang: "zh-CN", rate: 0.85 },
    );
  }, [item]);

  useEffect(() => {
    listen();
    return stopSpeech;
  }, [listen]);

  const leave = () => {
    stopSpeech();
    onBack();
  };

  if (!item) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">🎉</div>
        <h3 className="text-2xl font-black text-slate-800">今天的字都学会啦</h3>
        <Btn onClick={leave}>回到汉字探险岛</Btn>
      </div>
    );
  }

  const explain = () => {
    stopSpeech();
    onExplained(item.id);
    setExplained(true);
  };

  return (
    <HanziShell title="逐字学习" subtitle="我会数一数" onBack={leave} progress={`${index + 1}/${items.length}`}>
      <div className="mx-auto flex min-h-full max-w-4xl flex-col rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-3 shadow-[0_6px_0_#cfae70] sm:p-6">
        <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(8rem,.85fr)] items-center gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,.85fr)] sm:gap-4">
          <div className="mx-auto grid aspect-square w-full max-w-44 place-items-center rounded-[1.5rem] border-2 border-[#efd9ae] bg-white text-7xl font-black text-[#17365f] shadow-[0_4px_0_#e2cfaa] sm:max-w-72 sm:rounded-[2rem] sm:text-[9rem]">{item.char}</div>
          <div className="text-left">
            <div className="text-3xl font-black text-[#17365f] sm:text-4xl">{item.pinyin}</div>
            <div className="mt-1 text-xl font-black text-[#17365f] sm:mt-2 sm:text-2xl">{item.meaning}</div>
            <button type="button" onClick={listen} className="mt-3 min-h-11 rounded-full border-b-4 border-[#176fa6] bg-[#2f9fe4] px-4 font-black text-white sm:mt-4 sm:min-h-12 sm:px-7">🔊 听一听</button>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
          <section className="rounded-2xl border border-[#efd9ae] bg-white/75 p-3 sm:p-4"><h2 className="font-black text-[#147fc1]">记忆提示</h2><p className="mt-1 line-clamp-3 text-xs font-bold leading-5 text-[#57483f] sm:mt-2 sm:text-sm sm:leading-7">{item.story}</p></section>
          <section className="rounded-2xl border border-[#efd9ae] bg-white/75 p-3 sm:p-4"><h2 className="font-black text-[#147fc1]">常见词语</h2><div className="mt-2 grid grid-cols-2 gap-1.5 sm:mt-3 sm:gap-2">{item.words.map((word) => <span key={word} className="rounded-xl border border-[#edd9b5] bg-white px-1 py-1.5 text-center text-sm font-black text-[#17365f] sm:px-3 sm:py-2 sm:text-base">{word}</span>)}</div></section>
        </div>
        <section className="mt-2 rounded-2xl border border-[#efd9ae] bg-white/75 px-3 py-2 sm:mt-3 sm:p-4"><h2 className="inline font-black text-[#147fc1]">例句：</h2><p className="inline text-sm font-bold text-[#57483f] sm:text-base">生活中会用到“<span className="text-[#ef4f3f]">{item.words[0] ?? item.char}</span>”。</p></section>
        <nav aria-label="本单元汉字" className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:gap-3">
          {items.slice(0, 3).map((navItem, navIndex) => <button key={navItem.id} type="button" onClick={() => { stopSpeech(); setIndex(navIndex); setExplained(false); }} aria-current={navIndex === index ? "true" : undefined} className={`min-h-12 rounded-2xl border-2 bg-white text-3xl font-black shadow-[0_3px_0_#dfcba6] sm:min-h-16 sm:text-4xl ${navIndex === index ? "border-[#168fe0] text-[#17365f]" : "border-[#eadcc2] text-[#5d5148]"}`}>{navItem.char}</button>)}
        </nav>
        {!explained ? <button type="button" onClick={explain} className="mt-3 min-h-13 w-full rounded-2xl border-b-4 border-[#bd3328] bg-[#ff5e54] text-xl font-black text-white sm:mt-4 sm:min-h-14">★ 我讲完了</button> : <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4"><button type="button" onClick={() => { onLearned(item.id); onPractice(); }} className="min-h-13 rounded-2xl border-2 border-[#2f9fe4] bg-white px-5 font-black text-[#147fc1] sm:min-h-14">认一认</button><button type="button" onClick={() => { onLearned(item.id); onWriting(); }} className="min-h-13 rounded-2xl border-b-4 border-[#bd3328] bg-[#ff5e54] px-5 font-black text-white sm:min-h-14">写一写 →</button></div>}
      </div>
    </HanziShell>
  );
}
