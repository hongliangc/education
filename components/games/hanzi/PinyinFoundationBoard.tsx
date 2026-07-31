"use client";

import { useState } from "react";
import { PINYIN_CHART, pinyinAudioPath, pinyinToneAudioPath, pinyinToneExamples, type PinyinCategory, type PinyinChartItem } from "@/content/hanzi";

const CATEGORIES: readonly { id: PinyinCategory; label: string }[] = [
  { id: "simple-final", label: "单韵母" }, { id: "initial", label: "声母" },
  { id: "compound-final", label: "复韵母" }, { id: "nasal-final", label: "鼻韵母" },
  { id: "whole-syllable", label: "整体认读" },
];
const TONE_NAMES = ["一声", "二声", "三声", "四声"] as const;
const INITIAL_TONE_DEMO = ["bā · 八", "bá · 拔", "bǎ · 把", "bà · 爸"] as const;

export function PinyinFoundationBoard({ playPinyinClip, playPinyinSequence, speakExample, onComplete }: {
  playPinyinClip: (path: string) => void;
  playPinyinSequence: (paths: readonly string[]) => void;
  speakExample: (text: string) => void;
  onComplete: () => void;
}) {
  const [category, setCategory] = useState<PinyinCategory>("initial");
  const [selected, setSelected] = useState<PinyinChartItem | null>(PINYIN_CHART.find((item) => item.category === "initial") ?? null);
  const items = PINYIN_CHART.filter((item) => item.category === category);
  const toneChoices = selected ? pinyinToneExamples(selected).map((example) => ({ ...example, path: pinyinToneAudioPath(selected, example.tone) })) : [];
  const currentIndex = Math.max(0, items.findIndex((item) => item.id === selected?.id));

  const chooseCategory = (next: PinyinCategory) => {
    setCategory(next);
    setSelected(PINYIN_CHART.find((item) => item.category === next) ?? null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <nav aria-label="拼音分类" className="grid grid-cols-5 gap-1.5 rounded-2xl border border-[#d5e7ef] bg-white p-1.5">
        {CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => chooseCategory(item.id)} className={`min-h-10 rounded-xl px-1 text-[11px] font-black sm:text-sm ${category === item.id ? "bg-[#32a9e5] text-white shadow-[0_3px_0_#2387b8]" : "text-[#617985] hover:bg-[#edf8fd]"}`}>{item.label}</button>)}
      </nav>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col rounded-[1.5rem] border-2 border-[#b8dfee] bg-[#edf9ff] p-3">
          <div className="flex items-center justify-between"><h3 className="font-black text-[#287da5]">{CATEGORIES.find((item) => item.id === category)?.label}</h3><button type="button" onClick={() => playPinyinSequence(items.map(pinyinAudioPath))} className="min-h-11 rounded-xl bg-white px-5 text-xs font-black text-[#2783b0] ring-1 ring-[#b8ddec]">全部朗读</button></div>
          <div className="mt-3 grid min-h-0 grid-cols-4 gap-2 overflow-y-auto p-0.5 lg:grid-cols-3">
            {items.map((item) => <button key={item.id} type="button" onClick={() => { setSelected(item); playPinyinClip(pinyinAudioPath(item)); }} className={`min-h-14 rounded-xl px-2 py-2 text-xl font-black ring-2 sm:text-2xl ${selected?.id === item.id ? "bg-[#35a9e4] text-white ring-[#2488b9] shadow-[0_3px_0_#2488b9]" : "bg-white text-[#4f6470] ring-[#d5e5ec]"}`}>{item.display}</button>)}
          </div>
          <p className="mt-2 text-center text-xs font-black text-[#66808c]">学习顺序 {currentIndex + 1}/{items.length}</p>
        </aside>

        {selected ? <section className="flex min-h-0 flex-col rounded-[1.5rem] border-2 border-[#efd19a] bg-[#fffaf0] p-3 sm:p-5">
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)]">
            <button type="button" onClick={() => playPinyinClip(pinyinAudioPath(selected))} className={`grid aspect-square place-items-center rounded-[1.5rem] border-2 border-[#86cce9] bg-white font-black text-[#278dbd] shadow-[0_4px_0_#d7edf5] ${selected.display.length > 2 ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl"}`}><span>{selected.display}</span>{selected.category === "initial" ? <span className="text-[10px] font-bold text-[#66808c]">{selected.phonemeBase} · {selected.fallback}</span> : null}</button>
            <div><p className="text-xs font-black text-[#db7a35]">发音小秘诀</p><p className="mt-1 text-sm font-bold leading-6 text-[#66594f]">{selected.mouthHint}</p><button type="button" onClick={() => speakExample(`${selected.exampleChar}，${selected.exampleWord}`)} className="mt-2 w-full rounded-xl border border-[#efd9b0] bg-white px-3 py-2 text-left"><span className="text-2xl font-black text-[#df6638]">{selected.exampleChar}</span><span className="ml-2 text-xs font-bold text-[#786b60]">例子：{selected.exampleWord}</span></button></div>
          </div>

          <div className="mt-3 rounded-2xl bg-white p-3 ring-1 ring-[#eedfca]">
            <div className="flex items-center justify-between"><h4 className="text-sm font-black text-[#d95878]">四声练习 · 声调例字</h4><span className="text-[10px] font-bold text-[#9b8a7e]">点一下听发音</span></div>
            {toneChoices.length > 0 ? <div className="mt-2 grid grid-cols-4 gap-1.5">{toneChoices.map((tone, index) => <button key={tone.tone} type="button" onClick={() => playPinyinClip(tone.path)} className="min-h-16 rounded-xl bg-[#fff0f4] px-1 py-2 text-[#c74e70] ring-1 ring-[#f1c5d1]"><span className="block text-[10px] font-black">{TONE_NAMES[index]}</span><span className="mt-1 block text-base font-black text-[#584b44] sm:text-lg">{tone.syllable}</span><span className="block text-[10px] font-bold text-[#8b7770]">{tone.character}</span></button>)}</div> : <div className="mt-2 grid grid-cols-4 gap-1.5">{INITIAL_TONE_DEMO.map((demo, index) => <button key={demo} type="button" onClick={() => speakExample(demo.replace(" · ", "，"))} className="min-h-16 rounded-xl bg-[#fff0f4] px-1 py-2 ring-1 ring-[#f1c5d1]"><span className="block text-[10px] font-black text-[#c74e70]">{TONE_NAMES[index]}</span><span className="mt-1 block text-sm font-black text-[#584b44] sm:text-base">{demo}</span></button>)}</div>}
            {selected.category === "initial" ? <p className="mt-2 text-[10px] font-bold text-[#8b7666]">声母本身没有声调，要读得轻而短；四声用“b + a”示范拼读。</p> : null}
          </div>
        </section> : null}
      </div>

      <footer className="flex items-center gap-3 rounded-2xl border border-[#ded8cc] bg-white px-3 py-2">
        <span className="hidden text-xs font-black text-[#6f655d] sm:block">学习进度 {currentIndex + 1}/{items.length}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e9e3d9]"><div className="h-full rounded-full bg-[#69c65b]" style={{ width: `${items.length ? ((currentIndex + 1) / items.length) * 100 : 0}%` }} /></div><button type="button" onClick={onComplete} className="min-h-11 shrink-0 rounded-xl border-b-4 border-[#d74540] bg-[#ff5f57] px-4 text-xs font-black text-white sm:px-7 sm:text-sm">进入汉字拼音</button>
      </footer>
    </div>
  );
}
