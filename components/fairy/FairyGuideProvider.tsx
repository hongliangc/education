"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FairyChat } from "@/components/fairy/FairyChat";
import { FairySprite, type FairyMood } from "@/components/fairy/FairySprite";
import { FAIRY_CHAT_STATE_EVENT, FAIRY_GUIDE_EVENT, FAIRY_OVERLAY_STATE_EVENT, type FairyGuideDetail } from "@/lib/fairy-guide";
import { useGameStore } from "@/store/gameStore";
import { useVisualQa } from "@/lib/visual-qa";

const MOODS: Record<FairyGuideDetail["event"], FairyMood> = {
  enter: "happy",
  hint: "thinking",
  correct: "excited",
  incorrect: "surprised",
  complete: "excited",
};

export function FairyGuideProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const visualQa = useVisualQa();
  const child = useGameStore((state) => state.activeChild);
  const quietUntilFeedback = /^\/(story|literature)\//.test(pathname) || pathname === "/theater";
  const [chatOpen, setChatOpen] = useState(false);
  const [anotherChatOpen, setAnotherChatOpen] = useState(false);
  const [overlayHidden, setOverlayHidden] = useState(false);
  const [guide, setGuide] = useState<FairyGuideDetail | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const show = ({ detail }: CustomEvent<FairyGuideDetail>) => {
      const key = `mlk-fairy:${pathname}:${detail.event}`;
      if (detail.event === "enter" && sessionStorage.getItem(key)) return;
      if (detail.event === "enter") sessionStorage.setItem(key, "1");

      if (timer.current) clearTimeout(timer.current);
      setGuide(detail);
      if (detail.autoHideMs) {
        timer.current = setTimeout(() => setGuide(null), detail.autoHideMs);
      }
    };

    window.addEventListener(FAIRY_GUIDE_EVENT, show as EventListener);
    return () => {
      window.removeEventListener(FAIRY_GUIDE_EVENT, show as EventListener);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [pathname]);

  useEffect(() => {
    const update = ({ detail }: CustomEvent<boolean>) => setAnotherChatOpen(detail);
    window.addEventListener(FAIRY_CHAT_STATE_EVENT, update as EventListener);
    return () => window.removeEventListener(FAIRY_CHAT_STATE_EVENT, update as EventListener);
  }, []);

  useEffect(() => {
    const update = ({ detail }: CustomEvent<boolean>) => setOverlayHidden(detail);
    window.addEventListener(FAIRY_OVERLAY_STATE_EVENT, update as EventListener);
    return () => window.removeEventListener(FAIRY_OVERLAY_STATE_EVENT, update as EventListener);
  }, []);

  return (
    <>
      {children}
      {child && !visualQa && !anotherChatOpen && !overlayHidden && (!quietUntilFeedback || guide) ? (
        <div className="pointer-events-none fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] right-[calc(env(safe-area-inset-right)+0.75rem)] z-30 flex max-w-[calc(100vw-1.5rem)] flex-col items-end">
          {guide ? (
            <div
              role="status"
              aria-live="polite"
              className="storybook-paper pointer-events-auto relative mb-1 max-w-72 rounded-3xl px-4 py-3 pr-10 text-sm font-medium leading-relaxed text-slate-700 anim-fairy-enter"
            >
              {guide.text}
              <button
                type="button"
                onClick={() => setGuide(null)}
                aria-label="关闭小仙女提示"
                className="absolute right-1 top-1 grid size-9 place-items-center rounded-full text-lg text-slate-500 hover:bg-white focus-visible:bg-white"
              >
                ×
              </button>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setGuide(null);
              setChatOpen(true);
            }}
            aria-label="打开小仙女指导"
            className="pointer-events-auto rounded-full p-1 transition hover:scale-105 focus-visible:scale-105"
          >
            <FairySprite mood={guide ? MOODS[guide.event] : "happy"} size={guide ? 68 : 48} />
          </button>
        </div>
      ) : null}
      {chatOpen && child ? <FairyChat child={child} onClose={() => setChatOpen(false)} /> : null}
    </>
  );
}
