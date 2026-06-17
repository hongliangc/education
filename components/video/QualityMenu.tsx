"use client";

import { useState } from "react";
import type { OpenListVariant } from "@/lib/openlist/client-core";
import { qualityLabel } from "@/lib/video/player-ui";
import { cn } from "@/lib/utils";

interface QualityMenuProps {
  variants: OpenListVariant[];
  activeQuality: string | undefined;
  onSelect: (quality: string) => void;
}

export function QualityMenu({ variants, activeQuality, onSelect }: QualityMenuProps) {
  const [open, setOpen] = useState(false);
  if (variants.length <= 1) return null;

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className="fixed inset-0 z-0 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="relative z-10 flex h-11 min-w-16 items-center justify-center gap-1 rounded-full bg-white/10 px-3 text-sm font-bold text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20"
      >
        <span aria-hidden="true">⚙</span>
        {qualityLabel(activeQuality)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-14 right-0 z-10 min-w-32 overflow-hidden rounded-2xl bg-slate-900/80 p-1 shadow-2xl ring-1 ring-white/15 backdrop-blur-xl"
        >
          <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/40">
            清晰度
          </p>
          {variants.map((variant) => {
            const active = variant.quality === activeQuality;
            return (
              <button
                key={variant.quality}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSelect(variant.quality);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {qualityLabel(variant.quality)}
                {active && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
