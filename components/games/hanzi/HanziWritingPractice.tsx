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
import { HanziShell } from "./HanziShell";
import { showFairyGuide } from "@/lib/fairy-guide";

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
      <HanziShell title="书写完成" subtitle="每一笔都更稳了" onBack={onExit}>
        <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-5 shadow-[0_6px_0_#cfad70]">
          <GameDone starsEarned={stars} correctQ={completedChars} totalQ={round.length} onAgain={() => restart()} onClose={onExit} onChangeMode={onChangeMode} changeModeLabel="去认汉字" />
        </div>
      </HanziShell>
    );
  }

  if (!item) {
    return (
      <HanziShell title="汉字书写" subtitle="复习已经完成" onBack={onExit}>
        <div className="mx-auto max-w-2xl space-y-5 rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-5 text-center shadow-[0_6px_0_#cfad70]">
          <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-700 ring-1 ring-emerald-100">
            <div className="text-4xl">✅</div>
            <div className="mt-2 text-lg font-bold">所选内容暂时都掌握了</div>
            <div className="mt-1 text-sm">到复习时间后，这些字会自动回到写字练习里。</div>
          </div>
          <Btn variant="ghost" onClick={onChangeMode}>🔍 去认汉字</Btn>
        </div>
      </HanziShell>
    );
  }

  const next = () => {
    speechRef.current?.stop();
    speechRef.current = null;
    sfx.correct();
    onResult(item.id, true);
    const correct = completedChars + 1;
    setCompletedChars(correct);
    showFairyGuide({
      event: "correct",
      text: `“${item.char}”写完啦！记住它的笔顺。`,
      autoHideMs: 3200,
    });
    if (idx + 1 >= round.length) {
      const stars = Math.max(1, Math.round((correct / round.length) * 3));
      onComplete({
        score: correct * 25,
        totalQ: round.length,
        correctQ: correct,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        starsEarned: stars,
      });
      showFairyGuide({
        event: "complete",
        text: `写字练习完成！你写了 ${correct} 个字，获得 ${stars} 颗星。`,
        autoHideMs: 6500,
      });
      setDone(true);
    } else {
      setIdx((value) => value + 1);
      setStrokeTicks(0);
      setDemoRequest(0);
    }
  };

  return (
    <HanziShell title="汉字书写" subtitle="跟着笔顺写一写" onBack={onExit} progress={`${idx + 1}/${round.length}`}>
      <div className="mx-auto space-y-3 rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-3 shadow-[0_6px_0_#cfad70] sm:p-6">
      <div className="grid grid-cols-2 gap-2"><button type="button" className="min-h-11 rounded-2xl bg-rose-500 py-2.5 font-black text-white">单字练习</button><button type="button" onClick={() => setWritingMode("words")} className="min-h-11 rounded-2xl bg-white py-2.5 font-black text-slate-600 ring-1 ring-amber-200">词语练习</button></div>

      <div className="grid items-start gap-4 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_minmax(0,0.9fr)]">
        <section className="rounded-3xl bg-sky-50 p-4 text-center ring-1 ring-sky-100">
          <div className="text-xs font-black text-sky-600">✦ 当前汉字 ✦</div>
          <div className="mx-auto mt-3 grid aspect-square max-w-52 place-items-center rounded-3xl bg-white text-8xl font-black text-slate-800 shadow-sm ring-1 ring-sky-100">{item.char}</div>
          <div className="mt-3 text-3xl font-black text-pink-500">{item.pinyin}</div>
          <div className="mt-1 text-sm font-bold text-slate-500">{item.meaning}</div>
          <div className="mt-3 text-left text-sm font-black text-sky-700">📖 常见词语</div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">{item.words.map((word) => <span key={word} className="rounded-full bg-white px-3 py-1.5 text-sm font-black text-sky-700 ring-1 ring-sky-100">{word}</span>)}</div>
          <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => {
              speechRef.current?.stop();
              speechRef.current = speakText(`${item.char}。`, { lang: "zh-CN", fallbackText: item.char });
            }}
            className="min-h-11 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-sky-700 ring-1 ring-sky-200"
          >
            🔊 听这个字
          </button>
          <button
            type="button"
            onClick={() => setDemoRequest((value) => value + 1)}
            className="min-h-11 rounded-2xl bg-pink-50 px-4 py-2.5 text-sm font-bold text-pink-700 ring-1 ring-pink-200"
          >
            ✍️ 演示笔顺
          </button>
          </div>
        </section>
        <section className="min-w-0 rounded-3xl bg-white p-3 ring-1 ring-slate-200"><HanziWriterPad item={item} demoRequest={demoRequest} onStrokeCorrect={strokeCorrect} /></section>
        <aside className="space-y-3">
          <InfoPanel title="💡 笔顺提示"><div className="flex gap-2">{Array.from({ length: Math.min(4, Math.max(1, item.char.length + 2)) }, (_, step) => <span key={step} className="grid h-12 flex-1 place-items-center rounded-xl bg-white text-xl font-black text-slate-700 ring-1 ring-pink-100">{step + 1}</span>)}</div></InfoPanel>
          <InfoPanel title="🎯 当前任务"><p className="text-sm font-bold leading-6 text-slate-600">请按照正确的笔顺，在中间的田字格中写出这个字。</p></InfoPanel>
          <InfoPanel title="✏️ 笔画进度"><div className="flex justify-between text-sm font-black text-slate-600"><span>已写对</span><span>{strokeTicks} 笔</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-pink-400" style={{ width: `${Math.min(100, strokeTicks * 20)}%` }} /></div></InfoPanel>
          <InfoPanel title="💗 记忆小提示"><p className="text-sm font-bold leading-6 text-slate-600">{item.story}</p></InfoPanel>
        </aside>
      </div>

      <div className="rounded-2xl bg-amber-50 p-3 text-center text-sm font-bold text-amber-700 ring-1 ring-amber-100">
        {item.story}
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
    </HanziShell>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-2xl bg-pink-50/70 p-4 ring-1 ring-pink-100"><h3 className="mb-3 font-black text-pink-600">{title}</h3>{children}</section>;
}
