import type { ReactNode } from "react";

export function HanziShell({
  title,
  subtitle,
  progress,
  onBack,
  children,
  className = "",
  contentClassName = "",
}: {
  title: string;
  subtitle?: string;
  progress?: string;
  onBack: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section className={`relative flex h-[min(94vh,64rem)] min-h-0 flex-col overflow-hidden bg-[url('/ui/world/world-bg-mobile-v1.png')] bg-cover bg-center sm:bg-[url('/ui/world/world-bg-desktop-v1.png')] ${className}`}>
      <header className="relative z-10 shrink-0 px-3 pb-3 pt-4 sm:px-6 sm:pt-5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <button type="button" onClick={onBack} aria-label="返回汉字学习" className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#e3c98e] bg-[#fffaf0] text-2xl font-black text-[#287db0] shadow-[0_3px_0_#cdb47d] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white">←</button>
          <div className="min-w-0 flex-1 text-center text-[#17365f] [text-shadow:0_2px_0_white]">
            <h1 className="truncate text-2xl font-black sm:text-4xl">{title}</h1>
            {subtitle ? <p className="truncate text-xs font-black text-[#2b79a7] sm:text-sm">{subtitle}</p> : null}
          </div>
          {progress ? <span className="grid min-h-11 min-w-14 shrink-0 place-items-center rounded-full border-2 border-[#ead7ad] bg-[#fffaf0] px-3 text-sm font-black text-[#17365f] shadow-[0_3px_0_#cdb47d]">{progress}</span> : <span className="size-11" aria-hidden="true" />}
        </div>
        {progress ? <div className="mx-auto mt-3 flex max-w-sm items-center gap-2 rounded-full border border-[#ead7ad] bg-[#fffaf0]/95 px-3 py-1.5"><span className="text-amber-400">★</span><div role="progressbar" aria-label="学习进度" className="h-2 flex-1 overflow-hidden rounded-full bg-[#e9dfca]"><div className="h-full w-1/3 rounded-full bg-[#69c65b]" /></div></div> : null}
      </header>
      <div className={`relative z-[1] mx-auto min-h-0 w-full max-w-6xl flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6 ${contentClassName}`}>
        {children}
      </div>
    </section>
  );
}
