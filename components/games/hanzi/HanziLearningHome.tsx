"use client";

import { useState } from "react";
import type { HanziItem, HanziProgressMap, HanziSelectionMode } from "@/content/hanzi";
import type { Grade } from "@/lib/grades";
import { HanziCurriculumBrowser } from "./HanziCurriculumBrowser";

const ART = "/ui/hanzi/storybook-v3";

type Props = {
  grade: Grade;
  onStartDaily: () => void;
  onStartRecognition: () => void;
  onStartPinyin: () => void;
  onStartWriting: () => void;
  onStartStory: () => void;
  onStartIdiom: () => void;
  onOpenLibrary: () => void;
  onExit: () => void;
  items: readonly HanziItem[];
  currentUnitTitle: string;
  progress: HanziProgressMap;
  currentUnitId: string;
  selectedIds: readonly string[];
  onUnitChange: (unitId: string) => void;
  onSelectionChange: (ids: string[]) => void;
  onStartSelection: (ids: readonly string[], mode: HanziSelectionMode) => void;
  onOpenCharacter: (itemId: string, unitItemIds: readonly string[]) => void;
};

export function HanziLearningHome(props: Props) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const { onOpenCharacter } = props;
  const learnedCount = Object.keys(props.progress).length;
  const progressWidth = Math.min(100, Math.max(4, learnedCount * 4));

  if (catalogOpen) {
    return (
      <div className="flex h-[min(94vh,64rem)] flex-col overflow-hidden bg-[#fff8e7]">
        <header className="flex min-h-[4.5rem] items-center gap-3 border-b-4 border-[#8b572b] bg-[#b97836] px-4 text-white">
          <button type="button" onClick={() => setCatalogOpen(false)} aria-label="返回探险岛" className="grid size-11 place-items-center rounded-full bg-white/20 text-2xl font-black">←</button>
          <div><h1 className="text-xl font-black">汉字学习</h1><p className="text-xs font-bold text-white/80">课程目录</p></div>
          <button type="button" onClick={props.onExit} aria-label="关闭汉字学习" className="ml-auto grid size-11 place-items-center rounded-full bg-white/20 text-2xl font-black">×</button>
        </header>
        <div className="min-h-0 flex-1 p-3 sm:p-5">
          <HanziCurriculumBrowser progress={props.progress} currentUnitId={props.currentUnitId} selectedIds={props.selectedIds} onUnitChange={props.onUnitChange} onSelectionChange={props.onSelectionChange} onStartSelection={props.onStartSelection} onOpenCharacter={onOpenCharacter} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[min(94vh,64rem)] flex-col overflow-hidden bg-[url('/ui/world/world-bg-mobile-v1.png')] bg-cover bg-center sm:bg-[url('/ui/world/world-bg-desktop-v1.png')]">
      <header className="relative h-[8.25rem] shrink-0 overflow-hidden">
        <img src={`${ART}/title-plaque.webp`} alt="汉字探险岛 · 我会数一数" className="absolute left-1/2 top-0 h-[8.4rem] w-[21.5rem] max-w-[94%] -translate-x-1/2 object-cover object-center" />
        <button type="button" onClick={props.onExit} aria-label="关闭汉字学习" className="absolute right-3 top-3 z-10 grid size-11 place-items-center rounded-full border-2 border-[#d4a84c] bg-[#fff9e9] text-2xl font-black text-[#3c78aa] shadow-md">×</button>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 scroll-hide">
        <section className="relative mx-auto h-[20.5rem] max-w-xl">
          <div className="absolute inset-x-[7%] inset-y-[8%] rounded-[2rem] bg-[#fff8e8]" />
          <img src={`${ART}/mission-frame.png`} alt="" className="pointer-events-none absolute inset-0 size-full object-fill" />
          <div className="relative z-[1] flex h-full flex-col items-center px-[11%] pb-[9%] pt-[12%]">
            <p className="text-xs font-black text-[#bc742d]">今日任务 · {props.currentUnitTitle}</p>
            <h2 className="mt-1 text-2xl font-black text-[#4f392e]">今天学 <span className="text-3xl text-[#ef5a28]">{props.items.length}</span> 个字</h2>
            <div className="mt-3 grid w-full grid-cols-3 gap-3">
              {props.items.slice(0, 3).map((item) => <div key={item.id} className="grid h-24 place-items-center rounded-2xl border-2 border-[#ecd09b] bg-white/90 text-4xl font-black text-[#182d4b] shadow-[0_4px_0_#dbc59e]">{item.char}</div>)}
            </div>
            <div className="mt-3 flex w-full items-center gap-2"><span className="text-xl text-[#f2a51f]">★</span><div className="h-3 flex-1 overflow-hidden rounded-full border border-[#e1cba4] bg-[#eee3cf]"><div className="h-full rounded-full bg-[#6bc85c]" style={{ width: `${progressWidth}%` }} /></div><span className="text-xs font-black text-[#55483f]">{learnedCount}/{props.items.length}</span></div>
            <button type="button" onClick={props.onStartDaily} className="mt-3 min-h-12 w-full rounded-2xl border-2 border-[#f7a061] border-b-[5px] border-b-[#b73525] bg-[#ef4f3f] px-5 text-lg font-black text-white shadow-md active:translate-y-0.5">开始今日学习</button>
          </div>
        </section>

        <nav aria-label="学习入口" className="mx-auto mt-1 grid max-w-xl grid-cols-3 gap-2 px-1">
          <LessonEntry image={`${ART}/icon-hanzi.webp`} label="汉字学习" tone="blue" onClick={() => setCatalogOpen(true)} />
          <LessonEntry image={`${ART}/icon-pinyin.webp`} label="拼音乐园" tone="green" onClick={props.onStartPinyin} />
          <LessonEntry image={`${ART}/icon-idiom.webp`} label="成语" tone="purple" onClick={props.onStartIdiom} />
        </nav>

        <section className="mx-auto mt-2 flex max-w-xl items-center gap-2 rounded-2xl border-2 border-[#d8b16d] bg-[#fff8e6] px-3 py-2 shadow-[0_3px_0_#9a743e]">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#eef0c9] text-xl font-black text-[#765d25]">字</span>
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black text-[#9a7650]">继续上次学习</p><p className="truncate text-sm font-black text-[#4e392e]">{props.currentUnitTitle}</p></div>
          <button type="button" onClick={props.onStartRecognition} className="min-h-10 rounded-xl border-b-4 border-[#17679d] bg-[#278dcc] px-4 text-xs font-black text-white">继续学习</button>
        </section>

        <div className="mx-auto mt-2 flex max-w-xl justify-center gap-2">
          <QuickAction label="写字练习" onClick={props.onStartWriting} />
          <QuickAction label="故事识字" onClick={props.onStartStory} />
          <QuickAction label="学习记录" onClick={props.onOpenLibrary} />
        </div>
        <div className="mt-2 text-center"><button type="button" onClick={() => setCatalogOpen(true)} className="min-h-11 rounded-2xl border-2 border-[#c89958] border-b-4 border-b-[#8d6335] bg-[#fff2d2] px-9 font-black text-[#9d5525]">课程目录</button></div>
      </main>
    </div>
  );
}

function LessonEntry({ image, label, tone, onClick }: { image: string; label: string; tone: "blue" | "green" | "purple"; onClick: () => void }) {
  const color = tone === "blue" ? "border-[#65a9d5] text-[#275f91]" : tone === "green" ? "border-[#8fbc76] text-[#397339]" : "border-[#b493cf] text-[#77448f]";
  return <button type="button" onClick={onClick} className={`min-h-[6.9rem] overflow-hidden rounded-2xl border-2 bg-[#fff8e7] pb-2 shadow-[0_4px_0_#b89358] ${color}`}><img src={image} alt="" className="h-[4.8rem] w-full object-cover object-top" /><span className="block text-sm font-black">{label}</span></button>;
}

function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="min-h-10 rounded-xl border border-[#d7b97e] bg-[#fff8e8] px-3 text-xs font-black text-[#705037] shadow-sm">{label}</button>;
}
