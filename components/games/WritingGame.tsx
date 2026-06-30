"use client";

import { useState } from "react";
import { Btn } from "@/components/Btn";
import { getDefaultHanziLevel, type PrimaryGradeLevel } from "@/content/hanzi";
import type { Grade } from "@/lib/grades";
import type { OnComplete } from "./types";
import { HanziRecognitionRound } from "./hanzi/HanziRecognitionRound";
import { HanziWritingPractice } from "./hanzi/HanziWritingPractice";

type HanziMode = "menu" | "recognition" | "writing";

export function WritingGame({
  grade,
  onComplete,
  onExit,
}: {
  grade: Grade;
  onComplete: OnComplete;
  onExit: () => void;
}) {
  const [mode, setMode] = useState<HanziMode>("menu");
  const [level, setLevel] = useState<PrimaryGradeLevel>(() => getDefaultHanziLevel(grade));

  if (mode === "recognition") {
    return (
      <HanziRecognitionRound
        level={level}
        onLevelChange={setLevel}
        onComplete={onComplete}
        onExit={onExit}
        onChangeMode={() => setMode("writing")}
      />
    );
  }

  if (mode === "writing") {
    return (
      <HanziWritingPractice
        level={level}
        onLevelChange={setLevel}
        onComplete={onComplete}
        onExit={onExit}
        onChangeMode={() => setMode("recognition")}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-6xl">✏️</div>
        <h3 className="mt-2 text-2xl font-bold text-slate-800">汉字学习</h3>
        <p className="mt-1 text-sm text-slate-500">
          先认字，再看笔顺描红；字库按小学一年级到六年级逐级增加。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("recognition")}
          className="rounded-3xl bg-sky-50 p-5 text-left shadow ring-2 ring-sky-100 transition hover:bg-sky-100"
        >
          <span className="text-4xl">🔍</span>
          <span className="mt-3 block text-xl font-bold text-slate-800">识字闯关</span>
          <span className="mt-1 block text-sm text-slate-500">
            看字选义、听音选字、拼音辨认、词语找字。
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("writing")}
          className="rounded-3xl bg-pink-50 p-5 text-left shadow ring-2 ring-pink-100 transition hover:bg-pink-100"
        >
          <span className="text-4xl">🖊️</span>
          <span className="mt-3 block text-xl font-bold text-slate-800">笔顺写字</span>
          <span className="mt-1 block text-sm text-slate-500">
            先看动画，再按笔顺描红练习。
          </span>
        </button>
      </div>

      <div className="flex justify-center">
        <Btn variant="ghost" onClick={onExit}>
          回到地图
        </Btn>
      </div>
    </div>
  );
}
