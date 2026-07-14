"use client";

import { useState } from "react";
import { Btn } from "@/components/Btn";
import { PINYIN_CHART, pinyinAudioPath, pinyinToneAudioPath, pinyinToneExamples, type PinyinCategory, type PinyinChartItem } from "@/content/hanzi";

const CATEGORIES: readonly { id: PinyinCategory; label: string }[] = [
  { id: "simple-final", label: "单韵母" }, { id: "initial", label: "声母" },
  { id: "compound-final", label: "复韵母" }, { id: "nasal-final", label: "鼻韵母" },
  { id: "whole-syllable", label: "整体认读" },
];

export function PinyinFoundationBoard({
  playPinyinClip,
  playPinyinSequence,
  speakExample,
  onComplete,
}: {
  playPinyinClip: (path: string) => void;
  playPinyinSequence: (paths: readonly string[]) => void;
  speakExample: (text: string) => void;
  onComplete: () => void;
}) {
  const [category, setCategory] = useState<PinyinCategory>("simple-final");
  const [selected, setSelected] = useState<PinyinChartItem | null>(PINYIN_CHART.find((item) => item.category === "simple-final") ?? null);
  const items = PINYIN_CHART.filter((item) => item.category === category);
  const toneChoices = selected ? pinyinToneExamples(selected).map((example) => ({
    ...example,
    path: pinyinToneAudioPath(selected, example.tone),
  })) : [];

  const chooseCategory = (next: PinyinCategory) => {
    setCategory(next);
    setSelected(PINYIN_CHART.find((item) => item.category === next) ?? null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center"><div className="text-sm font-black text-sky-600">第一阶段 · 拼音表</div><h3 className="mt-1 text-xl font-black text-slate-800">点一个拼音，看口型 · 听发音 · 学例子</h3></div>
      <div className="flex items-center gap-2 overflow-x-auto px-2 pb-2 scroll-hide">
        <div className="flex flex-1 justify-center gap-2">{CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => chooseCategory(item.id)} className={`min-h-11 shrink-0 rounded-full px-5 py-2 text-sm font-black ${category === item.id ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{item.label}</button>)}</div>
        <Btn className="min-h-11 shrink-0 px-6" variant="secondary" onClick={() => playPinyinSequence(items.map(pinyinAudioPath))}>🔊 全部朗读</Btn>
      </div>
      <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-sky-50 p-4 ring-1 ring-sky-100"><h3 className="text-center text-lg font-black text-sky-700">{CATEGORIES.find((item) => item.id === category)?.label}</h3><div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); playPinyinClip(pinyinAudioPath(item)); }} className={`min-h-20 rounded-2xl px-3 py-3 text-2xl font-black ring-2 ${selected?.id === item.id ? "bg-sky-500 text-white ring-sky-600" : "bg-white text-slate-700 ring-slate-200"}`}>{item.display}</button>)}
        </div><div className="mt-4 text-center text-sm font-black text-slate-500">⭐ 学习顺序：{Math.max(1, items.findIndex((item) => item.id === selected?.id) + 1)} / {items.length}</div></aside>
      {selected ? <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 to-purple-50 p-5 text-center ring-1 ring-sky-100">
        <div className="text-7xl font-black text-sky-700">{selected.display}</div>
        {selected.category === "initial" ? <div className="mt-2 text-lg font-black text-sky-600">{selected.display} · {selected.phonemeBase} · {selected.fallback}</div> : null}
        <p className="mt-3 font-bold text-slate-600">👄 {selected.mouthHint}</p>
        <div className="mt-4 rounded-2xl bg-white p-3"><span className="text-4xl font-black text-slate-800">{selected.exampleChar}</span><span className="ml-3 font-bold text-slate-500">例子：{selected.exampleWord}</span></div>
        {toneChoices.length > 0 ? <div className="mt-4"><div className="text-sm font-black text-pink-600">声调例字</div><div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">{toneChoices.map((tone) => <button key={tone.tone} type="button" onClick={() => playPinyinClip(tone.path)} className="rounded-xl bg-pink-50 px-2 py-3 text-pink-700 ring-1 ring-pink-100"><span className="block text-xl font-black">{tone.label}</span><span className="mt-1 block text-base font-black text-slate-800">{tone.syllable} · {tone.character}</span><span className="mt-0.5 block text-xs font-bold text-slate-500">{tone.word}</span></button>)}</div></div> : <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 ring-1 ring-amber-100">声母本身没有声调；这里播放的是清晰的教学示范音，拼读时仍要轻而短。</div>}
        <div className="mt-4 flex justify-center gap-2"><Btn variant="secondary" onClick={() => playPinyinClip(pinyinAudioPath(selected))}>🔊 听发音</Btn><Btn variant="secondary" onClick={() => speakExample(`${selected.exampleChar}，${selected.exampleWord}`)}>🍎 听例子</Btn></div>
      </div> : null}
      </div>
      <div className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-slate-200"><span className="font-black text-slate-600">🚀 学习进度：{Math.max(1, items.findIndex((item) => item.id === selected?.id) + 1)} / {items.length}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-sky-500" style={{ width: `${items.length ? ((items.findIndex((item) => item.id === selected?.id) + 1) / items.length) * 100 : 0}%` }} /></div><Btn className="min-h-12 shrink-0 px-8" onClick={onComplete}>进入第二阶段：汉字拼音 →</Btn></div>
    </div>
  );
}
