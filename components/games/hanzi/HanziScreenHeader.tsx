export function HanziScreenHeader({ title, subtitle, onBack, progress }: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  progress?: string;
}) {
  return (
    <header className="flex items-center gap-3 rounded-2xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200">
      <button type="button" onClick={onBack} aria-label="返回汉字学习" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-lg font-black text-slate-700 hover:bg-sky-100 hover:text-sky-700">←</button>
      <div className="min-w-0 flex-1">
        {subtitle ? <div className="text-xs font-black text-sky-600">{subtitle}</div> : null}
        <h2 className="truncate text-lg font-black text-slate-800">{title}</h2>
      </div>
      {progress ? <span className="shrink-0 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">{progress}</span> : null}
    </header>
  );
}
