import {
  HANZI_CATALOG,
  getHanziStatus,
  type HanziCurriculumUnit,
  type HanziProgressMap,
} from "@/content/hanzi";

const ITEM_BY_CHAR = new Map(HANZI_CATALOG.map((item) => [item.char, item] as const));

export function HanziUnitCard({
  unit,
  progress,
  selected,
  recommended,
  onToggleGroup,
  onToggleChar,
}: {
  unit: HanziCurriculumUnit;
  progress: HanziProgressMap;
  selected: ReadonlySet<string>;
  recommended: boolean;
  onToggleGroup: (unit: HanziCurriculumUnit) => void;
  onToggleChar: (id: string) => void;
}) {
  const items = unit.recognizeChars.flatMap((char) => {
    const item = ITEM_BY_CHAR.get(char);
    return item ? [item] : [];
  });
  const allSelected = items.length > 0 && items.every((item) => selected.has(item.id));
  const known = items.filter((item) => getHanziStatus(progress[item.id]) === "known").length;

  return (
    <article className={`rounded-3xl bg-white p-4 shadow-sm ring-2 ${recommended ? "ring-sky-300" : "ring-slate-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h5 className="font-black text-slate-800">{unit.title}</h5>
            {recommended ? <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-black text-sky-700">推荐下一课</span> : null}
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500">{unit.objective}</p>
        </div>
        <span className="shrink-0 text-xs font-black text-emerald-600">已会 {known}/{items.length}</span>
      </div>

      <button type="button" onClick={() => onToggleGroup(unit)} className="mt-3 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
        {allSelected ? "取消全组" : "全组选取"}
      </button>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = selected.has(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleChar(item.id)}
              aria-pressed={active}
              className={`grid h-10 w-10 place-items-center rounded-xl text-xl font-black ring-2 ${active ? "bg-sky-500 text-white ring-sky-300" : "bg-slate-50 text-slate-700 ring-slate-100"}`}
            >
              {item.char}
            </button>
          );
        })}
      </div>
    </article>
  );
}
