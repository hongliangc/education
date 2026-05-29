"use client";

import { useEffect } from "react";

export function GameModal({
  title,
  emoji,
  color = "#f472b6",
  onClose,
  children,
}: {
  title: string;
  emoji: string;
  color?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-3 sm:p-6">
      <div className="anim-pop-in w-full max-w-3xl max-h-[92vh] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
        <header
          className="px-5 py-4 flex items-center justify-between text-white"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        >
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">{emoji}</span>
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/90 hover:text-white text-2xl bg-white/20 rounded-full w-9 h-9 flex items-center justify-center"
            aria-label="关闭游戏"
          >
            ×
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 scroll-hide">
          {children}
        </div>
      </div>
    </div>
  );
}
