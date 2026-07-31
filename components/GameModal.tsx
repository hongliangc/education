"use client";

import { useEffect } from "react";

export function GameModal({
  title,
  emoji,
  color = "#f472b6",
  onClose,
  hideHeader = false,
  wide = false,
  children,
}: {
  title: string;
  emoji: string;
  color?: string;
  onClose: () => void;
  hideHeader?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-40 flex justify-center bg-slate-900/45 backdrop-blur-sm ${
        hideHeader ? "items-end p-2 pt-16 sm:items-center sm:p-6 sm:pt-20" : "items-center p-2 sm:p-6"
      }`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`anim-pop-in flex w-full flex-col overflow-hidden bg-[#fffaf0] shadow-2xl ring-2 ring-white/80 ${
          hideHeader ? "max-h-[calc(100dvh-4.5rem)] sm:max-h-[calc(100dvh-5rem)]" : "max-h-[calc(100dvh-1rem)] sm:max-h-[94vh]"
        } ${wide ? "max-w-7xl rounded-[1.5rem]" : "max-w-3xl rounded-[2rem]"}`}
      >
        {!hideHeader ? <header
          className="flex items-center justify-between px-4 py-3 text-white sm:px-5 sm:py-4"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        >
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">{emoji}</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl text-white/90 transition hover:bg-white/30 hover:text-white focus-visible:ring-4 focus-visible:ring-white/80"
            aria-label="关闭游戏"
          >
            ×
          </button>
        </header> : null}
        <div className={`flex-1 ${hideHeader ? "min-h-0 overflow-hidden p-0" : "scroll-hide overflow-y-auto p-4 sm:p-7"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
