"use client";

import {
  type HanziItem,
  type HanziProgressMap,
  type HanziSelectionMode,
} from "@/content/hanzi";
import type { Grade } from "@/lib/grades";
import { HanziCurriculumBrowser } from "./HanziCurriculumBrowser";

export function HanziLearningHome({
  grade,
  onStartDaily,
  onStartRecognition,
  onStartPinyin,
  onStartWriting,
  onStartStory,
  onStartIdiom,
  onOpenLibrary,
  onExit,
  items,
  currentUnitTitle,
  progress,
  currentUnitId,
  selectedIds,
  onUnitChange,
  onSelectionChange,
  onStartSelection,
  onOpenCharacter,
}: {
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
}) {
  return (
    <div className="flex h-[min(94vh,64rem)] flex-col bg-[#fffdf9]">
      <header className="flex min-h-20 items-center gap-3 bg-gradient-to-r from-[#ff514a] to-[#ff6258] px-5 text-white sm:px-8">
        <span className="text-3xl">🏝️</span>
        <h2 className="text-xl font-black sm:text-2xl">汉字探险岛</h2>
        <span className="h-7 w-px bg-white/50" />
        <span className="font-black">{currentUnitTitle}</span>
        <span className="hidden h-7 w-px bg-white/50 sm:block" />
        <span className="hidden font-black sm:block">今天学 {items.length} 个字</span>
        <button type="button" onClick={onExit} aria-label="关闭汉字学习" className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-white/20 text-2xl font-black">×</button>
      </header>
      <nav aria-label="学习入口" className="grid grid-cols-2 gap-2 border-b border-orange-100 bg-white px-3 py-3 sm:grid-cols-4 sm:px-5">
        <LessonEntry icon="字" label="汉字学习" onClick={onStartDaily} />
        <LessonEntry icon="🔤" label="拼音乐园" onClick={onStartPinyin} />
        <LessonEntry icon="📜" label="成语" onClick={onStartIdiom} />
        <LessonEntry icon="📖" label="故事" onClick={onStartStory} />
      </nav>
      <div className="min-h-0 flex-1 p-3 sm:p-4">
        <HanziCurriculumBrowser progress={progress} currentUnitId={currentUnitId} selectedIds={selectedIds} onUnitChange={onUnitChange} onSelectionChange={onSelectionChange} onStartSelection={onStartSelection} onOpenCharacter={onOpenCharacter} />
      </div>
    </div>
  );
}

function LessonEntry({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 ring-1 ring-slate-100 hover:bg-sky-50 hover:text-sky-700"><span aria-hidden="true" className="text-base">{icon}</span>{label}</button>;
}
