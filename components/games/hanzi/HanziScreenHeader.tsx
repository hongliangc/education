export function HanziScreenHeader({ title, subtitle, onBack, progress }: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  progress?: string;
}) {
  return (
    <header className="flex items-center gap-3 rounded-2xl border-2 border-[#ead7ad] bg-[#fffaf0]/95 p-3 shadow-[0_4px_0_#d8c49b]">
      <button type="button" onClick={onBack} aria-label="返回汉字学习" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#eaf7ff] text-lg font-black text-[#287db0] ring-1 ring-[#b9dff0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white">←</button>
      <div className="min-w-0 flex-1">
        {subtitle ? <div className="text-xs font-black text-[#2b86b4]">{subtitle}</div> : null}
        <h2 className="truncate text-lg font-black text-[#17365f]">{title}</h2>
      </div>
      {progress ? <span className="shrink-0 rounded-full bg-[#eaf7ff] px-3 py-1.5 text-xs font-black text-[#287db0]">{progress}</span> : null}
    </header>
  );
}
