import type { HanziItem } from "@/content/hanzi";

export function HanziLearningCardPanel({
  item,
  selected,
  onClose,
  onListen,
  onToggleSelected,
}: {
  item: HanziItem;
  selected: boolean;
  onClose: () => void;
  onListen: () => void;
  onToggleSelected: () => void;
}) {
  return (
    <aside className="fixed inset-0 z-50 overflow-y-auto bg-[#fffdf9] p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between rounded-2xl bg-white p-3 ring-1 ring-slate-200">
        <div><span className="text-xs font-black text-sky-600">汉字学习卡</span><h2 className="text-xl font-black text-slate-800">认识“{item.char}”</h2></div>
        <button type="button" onClick={onClose} aria-label="关闭学习卡" className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-xl font-black text-slate-600">×</button>
      </div>
      <div className="mx-auto mt-4 grid h-28 w-28 place-items-center rounded-3xl bg-orange-50 text-7xl font-black text-orange-700 ring-2 ring-orange-200">{item.char}</div>
      <div className="mt-2 text-center text-2xl font-black text-pink-500">{item.pinyin}</div>
      <div className="mt-1 text-center font-black text-slate-700">{item.meaning}</div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{item.words.map((word) => <span key={word} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">{word}</span>)}</div>
      <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">{item.story}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={onListen} className="rounded-2xl bg-sky-100 py-3 font-black text-sky-700">🔊 听一听</button>
        <button type="button" onClick={onToggleSelected} className={`rounded-2xl py-3 font-black text-white ${selected ? "bg-slate-500" : "bg-emerald-500"}`}>{selected ? "移出校验" : "加入校验 ✓"}</button>
      </div>
      </div>
    </aside>
  );
}
