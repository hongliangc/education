"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import type { HanziItem } from "@/content/hanzi";
import { speakText, type SpeechController } from "@/lib/speech";
import { HanziScreenHeader } from "./HanziScreenHeader";

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
    <section className="h-[min(94vh,64rem)] space-y-4 overflow-y-auto bg-[#fffdf9] p-4 sm:p-6">
      <HanziScreenHeader title="逐字学习" subtitle="我会数一数" onBack={leave} progress={`${index + 1}/${items.length}`} />
      <div className="grid gap-4 md:grid-cols-[8rem_minmax(0,1fr)]">
        <nav aria-label="本单元汉字" className="flex gap-2 overflow-x-auto md:flex-col md:overflow-y-auto">
          {items.map((navItem, navIndex) => <button key={navItem.id} type="button" onClick={() => { stopSpeech(); setIndex(navIndex); setExplained(false); }} className={`min-h-12 min-w-16 rounded-2xl px-4 text-2xl font-black ring-1 ${navIndex === index ? "bg-sky-100 text-sky-700 ring-sky-400" : "bg-white text-slate-600 ring-slate-200"}`}>{navItem.char}</button>)}
        </nav>
        <div className="space-y-4">
          <div className="grid items-center gap-5 rounded-[2rem] bg-gradient-to-br from-amber-50 to-orange-100 p-5 ring-1 ring-orange-100 sm:grid-cols-2">
            <div className="mx-auto grid h-52 w-52 place-items-center rounded-[2rem] bg-white/80 text-9xl font-black text-orange-700 ring-1 ring-orange-200">{item.char}</div>
            <div className="text-center sm:text-left"><div className="text-3xl font-black text-slate-500">{item.pinyin}</div><div className="mt-2 text-xl font-black text-slate-800">{item.meaning}</div><Btn className="mt-4" variant="secondary" onClick={listen}>🔊 听一听</Btn></div>
          </div>
          <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200"><div className="font-black text-slate-800">🧩 组词</div><div className="mt-3 flex flex-wrap gap-2">{item.words.map((word) => <span key={word} className="rounded-full bg-orange-50 px-5 py-2 font-black text-orange-700">{word}</span>)}</div></div>
          <div className="rounded-3xl bg-sky-50 p-4 font-bold leading-7 text-slate-700 ring-1 ring-sky-100"><span className="font-black text-sky-700">例句：</span>生活中会用到“{item.words[0] ?? item.char}”。<p className="mt-2 text-sm text-slate-500">{item.story}</p></div>
          {!explained ? <div className="text-center"><Btn onClick={explain}>我讲完了 ✓</Btn></div> : <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => { onLearned(item.id); onPractice(); }} className="min-h-14 rounded-2xl bg-white px-5 font-black text-sky-600 ring-2 ring-sky-400">👁 认一认</button><button type="button" onClick={() => { onLearned(item.id); onWriting(); }} className="min-h-14 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-500 px-5 font-black text-white shadow-sm">写一写 →</button></div>}
        </div>
      </div>
    </section>
  );
}
