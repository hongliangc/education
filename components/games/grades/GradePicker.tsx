"use client";

import { useState } from "react";
import { buildGradeSelection, GRADE_LABELS, type Grade } from "@/lib/grades";

// Grade selection grid. The primary window (current ± one grade) is always shown; every
// lower grade is tucked behind a collapsible "more foundation" control. Options are derived
// from the child's confirmed grade so a child can only reach grades they may access.
export function GradePicker({
  childGrade,
  value,
  onChange,
}: {
  childGrade: Grade;
  value: Grade;
  onChange: (grade: Grade) => void;
}) {
  const { primary, foundation } = buildGradeSelection(childGrade);
  const [showFoundation, setShowFoundation] = useState(false);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {primary.map((g) => (
          <GradeCell key={g} grade={g} active={g === value} onSelect={() => onChange(g)} />
        ))}
      </div>

      {foundation.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowFoundation((v) => !v)}
            className="text-sm text-slate-500 underline"
          >
            {showFoundation ? "收起基础内容" : "更多基础内容"}
          </button>
          {showFoundation && (
            <div className="grid grid-cols-3 gap-2 mt-2 anim-slide-up">
              {foundation.map((g) => (
                <GradeCell
                  key={g}
                  grade={g}
                  active={g === value}
                  onSelect={() => onChange(g)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GradeCell({
  grade,
  active,
  onSelect,
}: {
  grade: Grade;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`rounded-2xl px-2 py-3 text-center ring-2 transition ${
        active
          ? "ring-pink-400 bg-pink-50 scale-105"
          : "ring-slate-200 hover:bg-slate-50"
      }`}
    >
      <div className="font-bold text-slate-700">{grade}</div>
      <div className="text-xs text-slate-500">{GRADE_LABELS[grade]}</div>
    </button>
  );
}
