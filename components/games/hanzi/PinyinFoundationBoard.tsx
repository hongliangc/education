"use client";

import { useState } from "react";
import { Btn } from "@/components/Btn";
import { PINYIN_CHART, PINYIN_FOUNDATIONS, pinyinSsml, type PinyinCategory, type PinyinChartItem } from "@/content/hanzi";

const CATEGORIES: readonly { id: PinyinCategory; label: string }[] = [
  { id: "simple-final", label: "单韵母" }, { id: "initial", label: "声母" },
  { id: "compound-final", label: "复韵母" }, { id: "nasal-final", label: "鼻韵母" },
  { id: "whole-syllable", label: "整体认读" },
];

export function PinyinFoundationBoard({
  speakPinyin,
  speakExample,
  onComplete,
}: {
  speakPinyin: (ssml: string, fallback: string) => void;
  speakExample: (text: string) => void;
  onComplete: () => void;
}) {
  const [category, setCategory] = useState<PinyinCategory>("simple-final");
  const [selected, setSelected] = useState<PinyinChartItem | null>(PINYIN_CHART.find((item) => item.category === "simple-final") ?? null);
  const items = PINYIN_CHART.filter((item) => item.category === category);
  const toneItem = selected?.category === "simple-final" ? PINYIN_FOUNDATIONS.find((item) => item.base === selected.display) : null;

  const chooseCategory = (next: PinyinCategory) => {
    setCategory(next);
    setSelected(PINYIN_CHART.find((item) => item.category === next) ?? null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center"><div className="text-sm font-black text-sky-600">第一阶段 · 拼音表</div><h3 className="mt-1 text-xl font-black text-slate-800">点一个拼音，看口型 · 听发音 · 学例子</h3></div>
      <div className="flex justify-center gap-2 overflow-x-auto px-2 pb-2 scroll-hide">
        {CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => chooseCategory(item.id)} className={`min-h-11 shrink-0 rounded-full px-5 py-2 text-sm font-black ${category === item.id ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{item.label}</button>)}
      </div>
      <div className="flex justify-center sm:justify-end"><Btn className="min-h-12 px-6" variant="secondary" onClick={() => speakPinyin(sequenceSsml(items), items.map((item) => item.fallback).join("，"))}>🔊 全部朗读</Btn></div>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
        {items.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); speakPinyin(item.lessonSsml, `${item.mouthHint}。${item.fallback}，${item.fallback}`); }} className={`min-h-14 rounded-2xl px-3 py-3 text-lg font-black ring-2 ${selected?.id === item.id ? "bg-sky-100 text-sky-700 ring-sky-300" : "bg-white text-slate-700 ring-slate-100"}`}>{item.display}</button>)}
      </div>
      {selected ? <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 to-purple-50 p-5 text-center ring-1 ring-sky-100">
        <div className="text-7xl font-black text-sky-700">{selected.display}</div>
        <p className="mt-3 font-bold text-slate-600">👄 {selected.mouthHint}</p>
        <div className="mt-4 rounded-2xl bg-white p-3"><span className="text-4xl font-black text-slate-800">{selected.exampleChar}</span><span className="ml-3 font-bold text-slate-500">例子：{selected.exampleWord}</span></div>
        {toneItem ? <div className="mt-4"><div className="text-sm font-black text-pink-600">四声</div><div className="mt-2 grid grid-cols-4 gap-2">{toneItem.tones.map((tone, index) => <button key={tone} type="button" onClick={() => speakPinyin(pinyinSsml(toneItem.ssmlBase, (index + 1) as 1 | 2 | 3 | 4), toneItem.speech)} className="rounded-xl bg-pink-50 py-2 text-xl font-black text-pink-600 ring-1 ring-pink-100">{tone}</button>)}</div></div> : null}
        <div className="mt-4 flex justify-center gap-2"><Btn variant="secondary" onClick={() => speakPinyin(selected.ssml, selected.fallback)}>🔊 听发音</Btn><Btn variant="secondary" onClick={() => speakExample(`${selected.exampleChar}，${selected.exampleWord}`)}>🍎 听例子</Btn></div>
      </div> : null}
      <div className="px-4 pb-2 text-center"><Btn className="min-h-12 px-8" onClick={onComplete}>进入第二阶段：汉字拼音 →</Btn></div>
    </div>
  );
}

function sequenceSsml(items: readonly PinyinChartItem[]): string {
  const sounds = items.map((item) => item.ssml.replace(/^<speak>|<\/speak>$/g, ""));
  return `<speak>${sounds.join('<break time="280ms"/>')}</speak>`;
}
