"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HANZI_CATALOG,
  HANZI_STAGES,
  getHanziStatus,
  getHanziUnit,
  getUnitsForStage,
  type HanziCurriculumUnit,
  type HanziItem,
  type HanziProgressEntry,
  type HanziProgressMap,
  type HanziSelectionMode,
  type HanziStageId,
} from "@/content/hanzi";

const STAGE_LABELS: Record<HanziStageId, string> = { foundation: "启蒙认字", life: "生活表达", reading: "阅读进阶", independent: "自主阅读" };
const ITEM_BY_CHAR = new Map(HANZI_CATALOG.map((item) => [item.char, item] as const));
const LAST_UNIT_KEY = "mlk-hanzi-last-unit";

export function HanziCurriculumBrowser({ progress, currentUnitId, selectedIds, onUnitChange, onSelectionChange, onStartSelection, onOpenCharacter }: {
  progress: HanziProgressMap;
  currentUnitId: string;
  selectedIds: readonly string[];
  onUnitChange?: (unitId: string) => void;
  onSelectionChange: (ids: string[]) => void;
  onStartSelection: (ids: readonly string[], mode: HanziSelectionMode) => void;
  onOpenCharacter?: (itemId: string, unitItemIds: readonly string[]) => void;
}) {
  const [activeUnitId, setActiveUnitId] = useState(currentUnitId);
  const [bookmarkedUnitId, setBookmarkedUnitId] = useState<string | null>(null);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const activeUnit = findUnit(activeUnitId) ?? findUnit(currentUnitId);
  const items = activeUnit?.recognizeChars.flatMap((char) => ITEM_BY_CHAR.get(char) ?? []) ?? [];
  const knownCount = items.filter((item) => getHanziStatus(progress[item.id]) === "known").length;

  useEffect(() => setBookmarkedUnitId(window.localStorage.getItem(LAST_UNIT_KEY)), []);

  const chooseUnit = (unit: HanziCurriculumUnit) => {
    if (activeUnit?.id && activeUnit.id !== unit.id) {
      setBookmarkedUnitId(activeUnit.id);
      window.localStorage.setItem(LAST_UNIT_KEY, activeUnit.id);
    }
    setActiveUnitId(unit.id); onUnitChange?.(unit.id);
  };
  const toggleSelected = (id: string) => {
    const next = new Set(selected); if (next.has(id)) next.delete(id); else next.add(id); onSelectionChange([...next]);
  };
  const start = () => {
    if (!activeUnit) return;
    const activeIds = new Set(items.map((item) => item.id));
    const mode: HanziSelectionMode = activeUnit.id === currentUnitId && selectedIds.every((id) => activeIds.has(id)) ? "mainline" : "free-practice";
    onStartSelection(selectedIds, mode);
  };

  const selectAll = () => onSelectionChange(items.map((item) => item.id));

  return (
    <div className="h-full overflow-hidden rounded-[1.75rem] border-2 border-[#efc887] bg-white shadow-[0_5px_0_#ead9bc] md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
      <nav className="hidden min-h-0 overflow-y-auto border-r-2 border-[#f0dfc5] bg-[#fffaf0] p-4 md:block">
        <div className="px-2 pb-1 text-xl font-black text-[#57463c]">学习目录</div>
        <p className="px-2 pb-3 text-xs font-bold text-[#a18c7b]">按阶段和主题选择学习内容</p>
        {HANZI_STAGES.map((stage) => <DirectoryStage key={stage} stage={stage} activeUnitId={activeUnit?.id} bookmarkedUnitId={bookmarkedUnitId} onChoose={chooseUnit} />)}
      </nav>
      <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto p-3 sm:p-6">
        <div className="mb-3 grid grid-cols-4 gap-1.5 md:hidden">{HANZI_STAGES.map((stage) => <button key={stage} type="button" onClick={() => { const first = getUnitsForStage(stage)[0]; if (first) chooseUnit(first); }} className={`min-h-10 rounded-xl px-1 text-[11px] font-black ${activeUnit?.stage === stage ? "bg-[#35a9e4] text-white" : "bg-[#eef8fd] text-[#557789] ring-1 ring-[#c9e6f3]"}`}>{STAGE_LABELS[stage]}</button>)}</div>
        <div className="mb-3 grid gap-1.5 md:hidden">{activeUnit ? getUnitsForStage(activeUnit.stage).map((unit) => { const unitItems = unit.recognizeChars.flatMap((char) => ITEM_BY_CHAR.get(char) ?? []); const mastered = unitItems.filter((item) => getHanziStatus(progress[item.id]) === "known").length; const active = unit.id === activeUnit.id; return <button key={unit.id} type="button" onClick={() => chooseUnit(unit)} className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-left ring-1 ${active ? "bg-[#eef8ff] text-[#277da6] ring-[#74c5e7]" : "bg-white text-[#74655a] ring-[#eadcc8]"}`}><span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black ${active ? "bg-[#35a9e4] text-white" : "bg-[#f2eee7] text-[#8c7e72]"}`}>{String(allUnits().findIndex((entry) => entry.id === unit.id) + 1)}</span><span className="min-w-0 flex-1 truncate text-xs font-black">{unit.title}</span><span className="text-[10px] font-bold opacity-70">{mastered}/{unitItems.length}</span></button>; }) : null}</div>
        {activeUnit ? <>
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#35a9e4] text-xl font-black text-white shadow-[0_3px_0_#2188b9]">{String(allUnits().findIndex((unit) => unit.id === activeUnit.id) + 1).padStart(2, "0")}</span><div className="min-w-0"><div className="text-xs font-black text-[#3189b5]">{STAGE_LABELS[activeUnit.stage]} / 当前学习单元</div><h3 className="truncate text-xl font-black text-[#57463c] sm:text-2xl">{activeUnit.title}</h3></div><span className="ml-auto shrink-0 text-xs font-black text-[#3a9b65] sm:text-sm">已掌握 {knownCount}/{items.length}</span></div>
          <p className="mt-2 text-sm font-bold text-[#887569]">{activeUnit.objective}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500"><StatusKey color="bg-orange-400" label="新内容" /><StatusKey color="bg-sky-400" label="学习中" /><StatusKey color="bg-violet-400" label="待复习" /><StatusKey color="bg-emerald-400" label="已掌握" /></div>
          <div className="mt-3 flex items-center justify-between"><p className="text-xs font-black text-[#8d7c6e]">选择本单元要学习的字</p><div className="flex gap-2"><button type="button" onClick={selectAll} className="text-xs font-black text-[#2787b8]">全选</button><span className="text-[#d2c2ae]">|</span><button type="button" onClick={() => onSelectionChange([])} className="text-xs font-black text-[#a47d63]">清空</button></div></div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">{items.map((item) => <HanziStateButton key={item.id} item={item} entry={progress[item.id]} selected={selected.has(item.id)} onToggle={() => toggleSelected(item.id)} onOpen={onOpenCharacter ? () => onOpenCharacter(item.id, items.map((unitItem) => unitItem.id)) : undefined} />)}</div>
          <div className="mt-auto flex flex-col gap-3 border-t border-[#eee2d0] pt-4 sm:flex-row sm:items-center"><div className="font-black text-[#66564b]">已选 <span className="text-[#ee7142]">{selectedIds.length}</span> 字</div><button type="button" onClick={start} disabled={selectedIds.length === 0} className="min-h-12 w-full rounded-2xl border-b-4 border-[#2385b8] bg-[#35a9e4] px-6 py-3 text-base font-black text-white disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-400 sm:ml-auto sm:w-auto sm:min-w-64">开始校验 · {selectedIds.length} 题</button></div>
        </> : null}
      </section>
    </div>
  );
}

function DirectoryStage({ stage, activeUnitId, bookmarkedUnitId, onChoose }: { stage: HanziStageId; activeUnitId?: string; bookmarkedUnitId: string | null; onChoose: (unit: HanziCurriculumUnit) => void }) {
  return <div className="mb-3"><div className="px-2 py-2 text-xs font-black text-slate-400">{STAGE_LABELS[stage]}</div>{getUnitsForStage(stage).map((unit) => { const index = allUnits().findIndex((entry) => entry.id === unit.id); const active = unit.id === activeUnitId; const bookmarked = unit.id === bookmarkedUnitId; return <button key={unit.id} type="button" onClick={() => onChoose(unit)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-black ring-1 ${active ? "bg-sky-50 text-sky-800 ring-sky-200" : bookmarked ? "bg-amber-50 text-slate-700 ring-amber-200" : "bg-white text-slate-700 ring-slate-100 hover:bg-slate-50"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-sky-500 text-white" : bookmarked ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate">{unit.title}</span>{bookmarked ? <span aria-label="上次访问">🔖</span> : null}</button>; })}</div>;
}

function HanziStateButton({ item, entry, selected, onToggle, onOpen }: { item: HanziItem; entry?: HanziProgressEntry; selected: boolean; onToggle: () => void; onOpen?: () => void }) {
  const status = !entry ? "new-content" : getHanziStatus(entry) === "practice" ? "learning" : getHanziStatus(entry);
  const visual = status === "known" ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : status === "review" ? "bg-violet-50 text-violet-700 ring-violet-300" : status === "learning" ? "bg-sky-50 text-sky-700 ring-sky-300" : "bg-orange-50 text-orange-700 ring-orange-200";
  return <div className="relative"><button type="button" onClick={onToggle} aria-label={`${item.char}，${status}，${selected ? "已选择" : "未选择"}`} className={`relative aspect-square w-full rounded-2xl pb-5 text-3xl font-black ring-2 transition hover:-translate-y-0.5 sm:text-4xl ${visual} ${selected ? "shadow-md ring-sky-500" : ""}`}>{item.char}{selected ? <span className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-sky-500 text-[10px] text-white">✓</span> : null}</button>{onOpen ? <button type="button" onClick={onOpen} className="absolute inset-x-1 bottom-1.5 min-h-5 rounded-lg bg-white/80 px-1 text-[9px] font-black text-[#52758a] sm:text-[10px]">进入单字学习</button> : null}</div>;
}

function StatusKey({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>; }

function findUnit(id: string) { return HANZI_CATALOG.map((item) => getHanziUnit(item.char)).find((unit) => unit?.id === id); }
function allUnits() { return HANZI_STAGES.flatMap((stage) => getUnitsForStage(stage)); }
