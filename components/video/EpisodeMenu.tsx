"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface EpisodeItem {
  id: string;
  title: string;
}

interface EpisodeMenuProps {
  episodes: EpisodeItem[];
  currentId: string;
  onSelect: (id: string) => void;
}

export function EpisodeMenu({ episodes, currentId, onSelect }: EpisodeMenuProps) {
  const [open, setOpen] = useState(false);
  if (episodes.length <= 1) return null;

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
        className="relative z-10 flex h-9 items-center justify-center rounded-lg px-2 text-sm font-medium text-white/85 transition hover:bg-white/15 hover:text-white sm:h-10"
      >
        选集
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-12 right-0 z-10 max-h-72 w-56 overflow-y-auto rounded-2xl bg-slate-900/85 p-1 shadow-2xl ring-1 ring-white/15 backdrop-blur-xl sm:bottom-14"
        >
          <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white/40">选集</p>
          {episodes.map((episode) => {
            const active = episode.id === currentId;
            return (
              <button
                key={episode.id}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  onSelect(episode.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <span className="truncate">{episode.title}</span>
                {active && <span aria-hidden="true">▶</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
