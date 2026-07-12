"use client";

import { useState } from "react";
import { HANZI_CATALOG, HANZI_IDIOMS, getHanziUnit, getIdiomStatus, type HanziItem, type IdiomProgressMap } from "@/content/hanzi";

export function HanziWordLibrary({ unitId }: { unitId: string }) {
  const groups = groupWordItems(HANZI_CATALOG.filter((item) => getHanziUnit(item.char)?.id === unitId));
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {groups.map((items) => {
        const words = [...new Set(items.flatMap((item) => item.words))];
        return <article key={items[0].groupId} className="rounded-3xl bg-amber-50 p-4 ring-1 ring-amber-100"><div className="font-black text-amber-800">{items[0].groupTitle}</div><div className="mt-2 flex flex-wrap gap-2">{words.map((word) => <span key={word} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-slate-600 shadow-sm">{word}</span>)}</div></article>;
      })}
    </section>
  );
}

function groupWordItems(items: readonly HanziItem[]): HanziItem[][] {
  const groups = new Map<string, HanziItem[]>();
  for (const item of items) groups.set(item.groupId, [...(groups.get(item.groupId) ?? []), item]);
  return [...groups.values()];
}

type IdiomFilter = "all" | "new" | "learning" | "review" | "used";

export function HanziIdiomLibrary({ idiomProgress }: { idiomProgress: IdiomProgressMap }) {
  const [filter, setFilter] = useState<IdiomFilter>("all");
  const filters: { value: IdiomFilter; label: string }[] = [{ value: "all", label: "全部" }, { value: "new", label: "未学习" }, { value: "learning", label: "学习中" }, { value: "review", label: "该复习" }, { value: "used", label: "已掌握" }];
  const idioms = HANZI_IDIOMS.filter((idiom) => {
    const status = getIdiomStatus(idiomProgress[idiom.id]);
    if (filter === "all") return true;
    if (filter === "learning") return status === "learned" || status === "explained";
    return status === filter;
  });
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap gap-2">{filters.map(({ value, label }) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-sm font-black ${filter === value ? "bg-purple-500 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{label}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">{idioms.map((idiom) => {
        const status = getIdiomStatus(idiomProgress[idiom.id]);
        const meta = status === "used" ? ["已掌握", "bg-emerald-50 text-emerald-700"] : status === "review" ? ["该复习", "bg-sky-50 text-sky-700"] : status === "new" ? ["未学习", "bg-slate-50 text-slate-500"] : ["学习中", "bg-purple-50 text-purple-700"];
        return <article key={idiom.id} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100"><div className="flex items-center justify-between gap-3"><div><div className="text-lg font-black text-slate-800">{idiom.idiom}</div><div className="text-xs font-bold text-pink-500">{idiom.pinyin}</div></div><span className={`rounded-full px-3 py-1 text-xs font-black ${meta[1]}`}>{meta[0]}</span></div><p className="mt-2 text-sm font-bold text-slate-500">{idiom.meaning}</p></article>;
      })}</div>
      {idioms.length === 0 ? <p className="rounded-3xl bg-white p-6 text-center font-bold text-slate-400">这个分类里还没有成语</p> : null}
    </section>
  );
}
