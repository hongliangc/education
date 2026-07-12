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

  return (
    <div className="h-full overflow-hidden rounded-[1.5rem] bg-white ring-1 ring-orange-100 md:grid md:grid-cols-[20rem_minmax(0,1fr)]">
      <nav className="hidden min-h-0 overflow-y-auto border-r border-orange-100 bg-[#fffdf9] p-4 md:block">
        <div className="px-2 pb-3 text-xl font-black text-slate-800">学习目录</div>
        {HANZI_STAGES.map((stage) => <DirectoryStage key={stage} stage={stage} activeUnitId={activeUnit?.id} bookmarkedUnitId={bookmarkedUnitId} onChoose={chooseUnit} />)}
      </nav>
      <section className="flex min-h-0 min-w-0 flex-col overflow-y-auto p-4 sm:p-7">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 md:hidden">{HANZI_STAGES.flatMap((stage) => getUnitsForStage(stage)).map((unit) => <button key={unit.id} type="button" onClick={() => chooseUnit(unit)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${unit.id === activeUnit?.id ? "bg-sky-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{unit.title.replace("我会", "")}</button>)}</div>
        {activeUnit ? <>
          <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-500 text-xl font-black text-white">{String(allUnits().findIndex((unit) => unit.id === activeUnit.id) + 1).padStart(2, "0")}</span><div><div className="text-xs font-black text-sky-600">{STAGE_LABELS[activeUnit.stage]} / 当前学习单元</div><h3 className="text-2xl font-black text-slate-800">{activeUnit.title}</h3></div><span className="ml-auto text-sm font-black text-emerald-600">已掌握 {knownCount}/{items.length}</span></div>
          <p className="mt-1 text-sm font-bold text-slate-500">{activeUnit.objective}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-500"><StatusKey color="bg-orange-400" label="新内容" /><StatusKey color="bg-sky-400" label="学习中" /><StatusKey color="bg-violet-400" label="待复习" /><StatusKey color="bg-emerald-400" label="已掌握" /></div>
          <div className="mt-5 grid grid-cols-5 gap-3">{items.map((item) => <HanziStateButton key={item.id} item={item} entry={progress[item.id]} selected={selected.has(item.id)} onClick={() => onOpenCharacter ? onOpenCharacter(item.id, items.map((unitItem) => unitItem.id)) : toggleSelected(item.id)} />)}</div>
          <div className="mt-auto flex items-center gap-4 border-t border-slate-100 pt-4"><div className="font-black text-slate-600">✅ 已选 {selectedIds.length} 字</div><button type="button" onClick={start} disabled={selectedIds.length === 0} className="ml-auto min-w-64 rounded-2xl bg-sky-500 px-6 py-4 text-lg font-black text-white shadow-sm disabled:bg-slate-200 disabled:text-slate-400">开始校验 · {selectedIds.length} 题</button></div>
        </> : null}
      </section>
    </div>
  );
}

function DirectoryStage({ stage, activeUnitId, bookmarkedUnitId, onChoose }: { stage: HanziStageId; activeUnitId?: string; bookmarkedUnitId: string | null; onChoose: (unit: HanziCurriculumUnit) => void }) {
  return <div className="mb-3"><div className="px-2 py-2 text-xs font-black text-slate-400">{STAGE_LABELS[stage]}</div>{getUnitsForStage(stage).map((unit) => { const index = allUnits().findIndex((entry) => entry.id === unit.id); const active = unit.id === activeUnitId; const bookmarked = unit.id === bookmarkedUnitId; return <button key={unit.id} type="button" onClick={() => onChoose(unit)} className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left font-black ring-1 ${active ? "bg-sky-50 text-sky-800 ring-sky-200" : bookmarked ? "bg-amber-50 text-slate-700 ring-amber-200" : "bg-white text-slate-700 ring-slate-100 hover:bg-slate-50"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${active ? "bg-sky-500 text-white" : bookmarked ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-500"}`}>{String(index + 1).padStart(2, "0")}</span><span className="min-w-0 flex-1 truncate">{unit.title}</span>{bookmarked ? <span aria-label="上次访问">🔖</span> : null}</button>; })}</div>;
}

function HanziStateButton({ item, entry, selected, onClick }: { item: HanziItem; entry?: HanziProgressEntry; selected: boolean; onClick: () => void }) {
  const status = !entry ? "new-content" : getHanziStatus(entry) === "practice" ? "learning" : getHanziStatus(entry);
  const visual = status === "known" ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : status === "review" ? "bg-violet-50 text-violet-700 ring-violet-300" : status === "learning" ? "bg-sky-50 text-sky-700 ring-sky-300" : "bg-orange-50 text-orange-700 ring-orange-200";
  return <button type="button" onClick={onClick} aria-label={`${item.char}，${status}`} className={`relative aspect-square rounded-2xl text-2xl font-black ring-2 transition hover:-translate-y-0.5 sm:text-4xl ${visual} ${selected ? "shadow-md ring-sky-500" : ""}`}>{item.char}{selected ? <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-sky-500 text-[9px] text-white">✓</span> : null}</button>;
}

function StatusKey({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${color}`} />{label}</span>; }

function findUnit(id: string) { return HANZI_CATALOG.map((item) => getHanziUnit(item.char)).find((unit) => unit?.id === id); }
function allUnits() { return HANZI_STAGES.flatMap((stage) => getUnitsForStage(stage)); }
