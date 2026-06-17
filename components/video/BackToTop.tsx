"use client";

import { useEffect, useState } from "react";

/** Floating "back to top" control: appears after scrolling down, smooth-scrolls up. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      aria-label="回到顶部"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="anim-pop-in fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl text-[var(--theater-accent)] ring-1 ring-white/25 backdrop-blur-xl transition hover:scale-110 hover:bg-white/25 active:translate-y-0.5"
    >
      ↑
    </button>
  );
}
