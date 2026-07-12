"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText, type SpeechController } from "@/lib/speech";
import {
  pickHanziWritingRoundFromPool,
  type HanziItem,
} from "@/content/hanzi";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { HanziWriterPad } from "./HanziWriterPad";
import { HanziWordWritingPractice } from "./HanziWordWritingPractice";
import { HanziScreenHeader } from "./HanziScreenHeader";

const ROUND_SIZE = 4;

export function HanziWritingPractice({
  onResult,
  onComplete,
  onExit,
  onChangeMode,
  items,
}: {
  onResult: (hanziId: string, correct: boolean) => void;
  onComplete: OnComplete;
  onExit: () => void;
  onChangeMode: () => void;
  items: readonly HanziItem[];
}) {
  const [writingMode, setWritingMode] = useState<"characters" | "words">("characters");
  const [round, setRound] = useState<HanziItem[]>(() =>
    pickHanziWritingRoundFromPool(items, ROUND_SIZE, Math.random),
  );
  const [idx, setIdx] = useState(0);
  const [completedChars, setCompletedChars] = useState(0);
  const [strokeTicks, setStrokeTicks] = useState(0);
  const [demoRequest, setDemoRequest] = useState(0);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const speechRef = useRef<SpeechController | null>(null);

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      speechRef.current = null;
    };
  }, []);

  const item = round[idx];

  const restart = useCallback(
    () => {
      setRound(pickHanziWritingRoundFromPool(items, ROUND_SIZE, Math.random));
      setIdx(0);
      setCompletedChars(0);
      setStrokeTicks(0);
      setDemoRequest(0);
      setDone(false);
      startedAt.current = Date.now();
    },
    [items],
  );

  const strokeCorrect = useCallback(() => {
    setStrokeTicks((value) => value + 1);
  }, []);

  if (writingMode === "words") return <HanziWordWritingPractice items={items} onResult={onResult} onComplete={onComplete} onExit={onExit} onCharacters={() => setWritingMode("characters")} />;

  if (done) {
    const stars = Math.max(1, Math.round((completedChars / round.length) * 3));
    return (
      <GameDone
        starsEarned={stars}
        correctQ={completedChars}
        totalQ={round.length}
        onAgain={() => restart()}
        onClose={onExit}
        onChangeMode={onChangeMode}
        changeModeLabel="去认汉字"
      />
    );
  }

  if (!item) {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-700 ring-1 ring-emerald-100">
          <div className="text-4xl">✅</div>
          <div className="mt-2 text-lg font-bold">所选内容暂时都掌握了</div>
          <div className="mt-1 text-sm">到复习时间后，这些字会自动回到写字练习里。</div>
        </div>
        <Btn variant="ghost" onClick={onChangeMode}>
          🔍 去认汉字
        </Btn>
      </div>
    );
  }

  const next = () => {
    speechRef.current?.stop();
    speechRef.current = null;
    sfx.correct();
    onResult(item.id, true);
    const correct = completedChars + 1;
    setCompletedChars(correct);
    if (idx + 1 >= round.length) {
      const stars = Math.max(1, Math.round((correct / round.length) * 3));
      onComplete({
        score: correct * 25,
        totalQ: round.length,
        correctQ: correct,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        starsEarned: stars,
      });
      setDone(true);
    } else {
      setIdx((value) => value + 1);
      setStrokeTicks(0);
      setDemoRequest(0);
    }
  };

  return (
    <div className="space-y-5">
      <HanziScreenHeader title="汉字书写" subtitle="跟着笔顺写一写" onBack={onExit} progress={`${idx + 1}/${round.length}`} />
      <div className="grid grid-cols-2 gap-2"><button type="button" className="rounded-2xl bg-sky-500 py-3 font-black text-white">单字练习</button><button type="button" onClick={() => setWritingMode("words")} className="rounded-2xl bg-white py-3 font-black text-slate-600 ring-1 ring-slate-200">词语练习</button></div>

      <div className="text-center">
        <div className="text-6xl font-bold text-slate-800">{item.char}</div>
        <div className="mt-1 text-2xl font-bold text-pink-500">{item.pinyin}</div>
        <div className="mt-1 text-sm text-slate-500">
          {item.meaning} · {item.words.join(" / ")}
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              speechRef.current?.stop();
              speechRef.current = speakText(item.char, { lang: "zh-CN" });
            }}
            className="rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-700"
          >
            🔊 听这个字
          </button>
          <button
            type="button"
            onClick={() => setDemoRequest((value) => value + 1)}
            className="rounded-full bg-pink-100 px-4 py-2 text-sm font-bold text-pink-700"
          >
            ✍️ 演示笔顺
          </button>
        </div>
      </div>

      <HanziWriterPad
        item={item}
        demoRequest={demoRequest}
        onStrokeCorrect={strokeCorrect}
      />

      <div className="rounded-3xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-700">
        {item.story}
        <div className="mt-1 text-xs text-amber-600">已写对 {strokeTicks} 笔，跟着提示完成描红。</div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Btn variant="ghost" onClick={onChangeMode}>
          🔍 去认汉字
        </Btn>
        <Btn variant="primary" onClick={next}>
          下一个字 ✓
        </Btn>
      </div>

      <p className="text-center text-sm text-slate-400">
        第 {idx + 1} 个字 / 共 {round.length} 个
      </p>
    </div>
  );
}
