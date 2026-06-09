"use client";

import { useState } from "react";
import { GRADE_LABELS, type Grade } from "@/lib/grades";
import { GradePicker } from "./GradePicker";

// Compact in-game control showing the active grade; tapping it opens the full picker so a
// child can practise an easier or one-higher grade without leaving the module.
export function GradeSwitcher({
  childGrade,
  value,
  onChange,
}: {
  childGrade: Grade;
  value: Grade;
  onChange: (grade: Grade) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition active:scale-95"
      >
        🎓 {GRADE_LABELS[value]}
        <span className="text-slate-400">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="anim-pop-in absolute right-0 z-30 mt-2 w-64 rounded-3xl bg-white p-4 shadow-2xl ring-1 ring-slate-100">
          <p className="mb-2 text-xs text-slate-500">选择练习年级</p>
          <GradePicker
            childGrade={childGrade}
            value={value}
            onChange={(g) => {
              onChange(g);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
