"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakChunks, stopSpeaking, type SpeechController } from "@/lib/speech";
import type { StoryQuestion as StoryQuestionData } from "@/content/storybooks/types";
import {
  QUESTION_REPLAY_LABEL,
  startQuestionNarration,
} from "./questionNarration";

export function StoryQuestion({
  question,
  index,
  total,
  onReplay,
  onAnswered,
  lastLabel = "看看道理 →",
}: {
  question: StoryQuestionData;
  index: number;
  total: number;
  onReplay: () => void;
  onAnswered: (correct: boolean) => void;
  lastLabel?: string; // 最后一题按钮文案；寓言默认「看看道理」，名句卡传「看完啦 ✓」
}) {
  const [chosen, setChosen] = useState<number | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(
    () => () => {
      speechRef.current?.stop();
      speechRef.current = null;
    },
    [],
  );

  const choose = (i: number) => {
    if (chosen !== null) return;
    const ok = i === question.answer;
    setChosen(i);
    if (ok) sfx.correct();
    else sfx.wrong();
    stopSpeaking();
    speechRef.current = startQuestionNarration(speakChunks, question.explain);
  };

  const next = () => {
    if (chosen === null) return;
    const ok = chosen === question.answer;
    speechRef.current?.stop();
    speechRef.current = null;
    setChosen(null);
    onAnswered(ok);
  };

  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">
        第 {index + 1} 题 / 共 {total} 题
      </div>
      <div className="rounded-2xl bg-purple-50 ring-1 ring-purple-100 p-4">
        <div className="flex items-start gap-3">
          <p className="flex-1 font-bold text-slate-700">{question.q}</p>
          <button
            type="button"
            onClick={() => {
              speechRef.current?.stop();
              speechRef.current = null;
              onReplay();
            }}
            aria-label={QUESTION_REPLAY_LABEL}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-bold text-purple-600 ring-1 ring-purple-200 transition hover:bg-purple-100"
          >
            🔊 再听一次
          </button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {question.choices.map((c, i) => {
          const isChosen = chosen === i;
          const isCorrect = question.answer === i;
          const reveal = chosen !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={chosen !== null}
              className={`w-full text-left rounded-2xl px-4 py-3 ring-2 transition ${
                reveal && isCorrect
                  ? "bg-emerald-100 ring-emerald-400 text-emerald-800"
                  : reveal && isChosen
                  ? "bg-rose-100 ring-rose-400 text-rose-800 anim-shake"
                  : "bg-white ring-slate-200 hover:bg-purple-50"
              }`}
            >
              <span className="font-bold mr-2">
                {String.fromCharCode(65 + i)}.
              </span>
              {c}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <div className="mt-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 anim-slide-up">
          <p className="text-sm text-amber-800 leading-relaxed">
            💡 {question.explain}
          </p>
          <div className="mt-3 text-right">
            <Btn variant="primary" onClick={next}>
              {index + 1 >= total ? lastLabel : "下一题 →"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
