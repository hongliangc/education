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
import { HanziShell } from "./HanziShell";

type LibrarySection = "hanzi" | "words" | "idioms";

export function HanziLibraryProgress({
  progress,
  idiomProgress,
  currentUnitId,
  selectedIds,
  onSelectionChange,
  onStartSelection,
  onBack,
}: {
  progress: HanziProgressMap;
  idiomProgress: IdiomProgressMap;
  currentUnitId: string;
  selectedIds: readonly string[];
  onSelectionChange: (ids: string[]) => void;
  onStartSelection: (ids: readonly string[], mode: HanziSelectionMode) => void;
  onBack: () => void;
}) {
  const [section, setSection] = useState<LibrarySection | null>(null);
  const groups = categorizeHanzi(HANZI_CATALOG, progress);

  if (!section) {
    const cards: { id: LibrarySection; image: string; title: string; detail: string; className: string }[] = [
      { id: "hanzi", image: "/ui/hanzi/storybook-v3/icon-hanzi.webp", title: "我的汉字", detail: `已会 ${groups.known.length} / ${HANZI_CATALOG.length}`, className: "border-[#82c5e5]" },
      { id: "words", image: "/ui/hanzi/storybook-v3/icon-pinyin.webp", title: "我的组词", detail: "按课程积累常用词语", className: "border-[#e6c076]" },
      { id: "idioms", image: "/ui/hanzi/storybook-v3/icon-idiom.webp", title: "我的成语", detail: `共 ${Object.keys(idiomProgress).length} 条学习记录`, className: "border-[#bd9fd7]" },
    ];
    return (
      <HanziShell title="学习记录" subtitle="看看我学会了什么" onBack={onBack}>
      <section className="mx-auto max-w-4xl space-y-4 rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-4 shadow-[0_6px_0_#cfad70] sm:p-6">
        <div><h2 className="text-2xl font-black text-[#17365f]">选择学习内容</h2><p className="mt-1 text-sm font-bold text-[#78685c]">先选目标单元，也可以逐字自由练习。</p></div>
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => <button key={card.id} type="button" onClick={() => setSection(card.id)} className={`min-h-44 overflow-hidden rounded-3xl border-2 bg-white text-left shadow-[0_4px_0_#dfcba6] transition hover:-translate-y-0.5 ${card.className}`}><img src={card.image} alt="" className="h-24 w-full object-cover object-top" /><span className="block px-4 text-lg font-black text-[#17365f]">{card.title}</span><span className="mt-1 block px-4 pb-4 text-sm font-bold text-[#78685c]">{card.detail}</span></button>)}
        </div>
      </section>
      </HanziShell>
    );
  }

  return (
    <HanziShell title="学习记录" subtitle={section === "hanzi" ? "我的汉字" : section === "words" ? "我的组词" : "我的成语"} onBack={onBack}>
    <section className="mx-auto max-w-5xl space-y-4 rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-4 shadow-[0_6px_0_#cfad70] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={() => setSection(null)} className="text-sm font-black text-sky-600">← 返回内容分类</button>
        <h3 className="text-xl font-black text-slate-800">{section === "hanzi" ? "🈶 我的汉字" : section === "words" ? "🧩 我的组词" : "📜 我的成语"}</h3>
      </div>
      {section === "hanzi" ? <HanziCurriculumBrowser progress={progress} currentUnitId={currentUnitId} selectedIds={selectedIds} onSelectionChange={onSelectionChange} onStartSelection={onStartSelection} /> : null}
      {section === "words" ? <HanziWordLibrary unitId={currentUnitId} /> : null}
      {section === "idioms" ? <HanziIdiomLibrary idiomProgress={idiomProgress} /> : null}
    </section>
    </HanziShell>
  );
}
