"use client";

import { HANZI_LEVELS, type PrimaryGradeLevel } from "@/content/hanzi";
import { cn } from "@/lib/utils";

const LEVEL_LABELS: Record<PrimaryGradeLevel, string> = {
  G1: "一年级",
  G2: "二年级",
  G3: "三年级",
  G4: "四年级",
  G5: "五年级",
  G6: "六年级",
};

export function HanziLevelTabs({
  level,
  onChange,
}: {
  level: PrimaryGradeLevel;
  onChange: (level: PrimaryGradeLevel) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {HANZI_LEVELS.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onChange(item)}
          className={cn(
            "rounded-2xl px-3 py-2 text-sm font-bold ring-2 transition",
            item === level
              ? "bg-pink-500 text-white ring-pink-200"
              : "bg-white text-slate-600 ring-slate-100 hover:bg-pink-50",
          )}
        >
          {LEVEL_LABELS[item]}
        </button>
      ))}
    </div>
  );
}
