"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { HANZI_KEY_WORDS, type HanziItem } from "@/content/hanzi";
import { speakText, type SpeechController } from "@/lib/speech";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { HanziWriterPad } from "./HanziWriterPad";
import { HanziScreenHeader } from "./HanziScreenHeader";

const WORD_ROUND_SIZE = 3;

export function HanziWordWritingPractice({ items, onResult, onComplete, onExit, onCharacters }: { items: readonly HanziItem[]; onResult: (hanziId: string, correct: boolean) => void; onComplete: OnComplete; onExit: () => void; onCharacters: () => void }) {
  const [roundKey, setRoundKey] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [strokeTicks, setStrokeTicks] = useState(0);
  const [demoRequest, setDemoRequest] = useState(0);
  const [done, setDone] = useState(false);
  const startedAt = useRef(Date.now());
  const speechRef = useRef<SpeechController | null>(null);
  const words = useMemo(() => {
    const ids = new Set(items.map((item) => item.id));
    const complete = HANZI_KEY_WORDS.filter((word) => word.items.every((item) => ids.has(item.id)));
    const relevant = complete.length > 0 ? complete : HANZI_KEY_WORDS.filter((word) => word.items.some((item) => ids.has(item.id)));
    return shuffled(relevant).slice(0, WORD_ROUND_SIZE);
  }, [items, roundKey]);
  const currentWord = words[wordIndex];
  const item = currentWord?.items[charIndex];

  useEffect(() => () => speechRef.current?.stop(), []);
  useEffect(() => {
    if (!currentWord) return;
    speechRef.current?.stop();
    speechRef.current = speakText(currentWord.word, { lang: "zh-CN", rate: 0.8 });
  }, [currentWord]);

  const restart = () => {
    setWordIndex(0); setCharIndex(0); setStrokeTicks(0); setDemoRequest(0); setDone(false); setRoundKey((value) => value + 1); startedAt.current = Date.now();
  };

  if (done) return <GameDone starsEarned={3} correctQ={words.length} totalQ={words.length} onAgain={() => restart()} onClose={onExit} onChangeMode={onCharacters} changeModeLabel="单字练习" />;
  if (!currentWord || !item) return <div className="py-8 text-center font-bold text-slate-500">所选单元的重点词语还在准备中。</div>;

  const next = () => {
    speechRef.current?.stop();
    onResult(item.id, true);
    setStrokeTicks(0); setDemoRequest(0);
    if (charIndex + 1 < currentWord.items.length) { setCharIndex((value) => value + 1); return; }
    speechRef.current = speakText(currentWord.word, { lang: "zh-CN", rate: 0.8 });
    if (wordIndex + 1 < words.length) { setWordIndex((value) => value + 1); setCharIndex(0); return; }
    onComplete({ score: words.length * 30, totalQ: words.length, correctQ: words.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000), starsEarned: 3 });
    setDone(true);
  };

  return <div className="space-y-5">
    <HanziScreenHeader title="词语书写" subtitle="在词语中练汉字" onBack={onExit} progress={`${wordIndex + 1}/${words.length}`} />
    <div className="grid grid-cols-2 gap-2"><button type="button" onClick={onCharacters} className="rounded-2xl bg-white py-3 font-black text-slate-600 ring-1 ring-slate-200">单字练习</button><button type="button" className="rounded-2xl bg-pink-500 py-3 font-black text-white">词语练习</button></div>
    <section className="rounded-3xl bg-amber-50 p-4 text-center ring-1 ring-amber-100"><div className="text-xs font-black text-amber-600">重点词语 {wordIndex + 1}/{words.length}</div><div className="mt-1 text-4xl font-black tracking-widest text-slate-800">{currentWord.items.map((wordItem, index) => <span key={`${wordItem.id}-${index}`} className={index === charIndex ? "text-pink-600 underline decoration-amber-300 decoration-4 underline-offset-8" : ""}>{wordItem.char}</span>)}</div><p className="mt-4 text-sm font-bold text-slate-500">{currentWord.example}</p><button type="button" onClick={() => { speechRef.current?.stop(); speechRef.current = speakText(currentWord.word, { lang: "zh-CN" }); }} className="mt-3 rounded-full bg-white px-4 py-2 text-sm font-black text-amber-700">🔊 朗读词语</button></section>
    <div className="text-center"><div className="text-sm font-black text-pink-500">当前要写</div><div className="text-6xl font-black text-slate-800">{item.char}</div><div className="text-lg font-black text-pink-500">{item.pinyin}</div></div>
    <HanziWriterPad item={item} demoRequest={demoRequest} onStrokeCorrect={() => setStrokeTicks((value) => value + 1)} />
    <div className="flex justify-center gap-3"><Btn variant="secondary" onClick={() => setDemoRequest((value) => value + 1)}>演示笔顺</Btn><Btn onClick={next}>{charIndex + 1 < currentWord.items.length ? "下一个字" : wordIndex + 1 < words.length ? "完成这个词" : "完成练习"} ✓</Btn></div>
    <p className="text-center text-xs font-bold text-slate-400">已写对 {strokeTicks} 笔</p>
  </div>;
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) { const target = Math.floor(Math.random() * (index + 1)); [result[index], result[target]] = [result[target], result[index]]; }
  return result;
}
