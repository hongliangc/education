"use client";

import { useState } from "react";
import {
  HANZI_CATALOG,
  categorizeHanzi,
  type HanziProgressMap,
  type HanziSelectionMode,
  type IdiomProgressMap,
} from "@/content/hanzi";
import { HanziCurriculumBrowser } from "./HanziCurriculumBrowser";
import { HanziIdiomLibrary, HanziWordLibrary } from "./HanziLibraryExtras";

type LibrarySection = "hanzi" | "words" | "idioms";

export function HanziLibraryProgress({
  progress,
  idiomProgress,
  currentUnitId,
  selectedIds,
  onSelectionChange,
  onStartSelection,
}: {
  progress: HanziProgressMap;
  idiomProgress: IdiomProgressMap;
  currentUnitId: string;
  selectedIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
  onStartSelection: (ids: readonly string[], mode: HanziSelectionMode) => void;
}) {
  const [section, setSection] = useState<LibrarySection | null>(null);
  const groups = categorizeHanzi(HANZI_CATALOG, progress);

  if (!section) {
    const cards: { id: LibrarySection; icon: string; title: string; detail: string; className: string }[] = [
      { id: "hanzi", icon: "🈶", title: "我的汉字", detail: `已会 ${groups.known.length} / ${HANZI_CATALOG.length}`, className: "bg-sky-50 ring-sky-100" },
      { id: "words", icon: "🧩", title: "我的组词", detail: "按课程积累常用词语", className: "bg-amber-50 ring-amber-100" },
      { id: "idioms", icon: "📜", title: "我的成语", detail: `共 ${Object.keys(idiomProgress).length} 条学习记录`, className: "bg-purple-50 ring-purple-100" },
    ];
    return (
      <section className="space-y-4">
        <div><h3 className="text-2xl font-black text-slate-800">选择学习内容</h3><p className="mt-1 text-sm font-bold text-slate-500">先选目标单元，也可以逐字自由练习。</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => <button key={card.id} type="button" onClick={() => setSection(card.id)} className={`rounded-3xl p-5 text-left shadow-sm ring-1 transition hover:-translate-y-0.5 ${card.className}`}><span className="text-4xl">{card.icon}</span><span className="mt-3 block text-lg font-black text-slate-800">{card.title}</span><span className="mt-1 block text-sm font-bold text-slate-500">{card.detail}</span></button>)}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setSection(null)} className="text-sm font-black text-sky-600">← 返回内容分类</button>
        <h3 className="text-xl font-black text-slate-800">{section === "hanzi" ? "🈶 我的汉字" : section === "words" ? "🧩 我的组词" : "📜 我的成语"}</h3>
      </div>
      {section === "hanzi" ? <HanziCurriculumBrowser progress={progress} currentUnitId={currentUnitId} selectedIds={selectedIds} onSelectionChange={onSelectionChange} onStartSelection={onStartSelection} /> : null}
      {section === "words" ? <HanziWordLibrary unitId={currentUnitId} /> : null}
      {section === "idioms" ? <HanziIdiomLibrary idiomProgress={idiomProgress} /> : null}
    </section>
  );
}
