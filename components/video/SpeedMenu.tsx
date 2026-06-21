"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface SpeedMenuProps {
  rate: number;
  onSelect: (rate: number) => void;
}

const rateLabel = (rate: number) => (rate === 1 ? "倍速" : `${rate}×`);

export function SpeedMenu({ rate, onSelect }: SpeedMenuProps) {
  const [open, setOpen] = useState(false);

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
        className="relative z-10 flex h-9 min-w-[2.75rem] items-center justify-center rounded-lg px-2 text-sm font-medium text-white/85 transition hover:bg-white/15 hover:text-white sm:h-10"
      >
        {rateLabel(rate)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-12 right-0 z-10 min-w-28 overflow-hidden rounded-2xl bg-slate-900/80 p-1 shadow-2xl ring-1 ring-white/15 backdrop-blur-xl sm:bottom-14"
        >
          <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/40">
            播放速度
          </p>
          {PLAYBACK_RATES.map((value) => {
            const active = value === rate;
            return (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSelect(value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                {value === 1 ? "正常" : `${value}×`}
                {active && <span aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
