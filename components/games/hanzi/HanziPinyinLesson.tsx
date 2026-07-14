"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { PINYIN_SYLLABLES, shufflePinyinChoices, type PinyinSyllable } from "@/content/hanzi";
import { playClip, playClipSequence, speakPinyin, speakText, type SpeechController } from "@/lib/speech";
import { PinyinFoundationBoard } from "./PinyinFoundationBoard";
import { HanziScreenHeader } from "./HanziScreenHeader";

const LESSON_SIZE = 10;
const CURSOR_KEY = "mlk-pinyin-syllable-cursor";
type PinyinStage = "foundation" | "characters";

export function HanziPinyinLesson({ childId, onBack }: { childId: string; onBack: () => void }) {
  const [stage, setStage] = useState<PinyinStage>("foundation");
  const speechRef = useRef<SpeechController | null>(null);
  const stopSpeech = () => {
    speechRef.current?.stop();
    speechRef.current = null;
  };
  useEffect(() => stopSpeech, []);
  const speak = (text: string) => {
    stopSpeech();
    speechRef.current = speakText(text, { lang: "zh-CN", rate: 0.8 });
  };
  const speakExactPinyin = (ssml: string, fallback: string) => {
    stopSpeech();
    speechRef.current = speakPinyin(ssml, fallback);
  };
  const playStaticPinyin = (path: string) => {
    stopSpeech();
    speechRef.current = playClip(path);
  };
  const playStaticSequence = (paths: readonly string[]) => {
    stopSpeech();
    speechRef.current = playClipSequence(paths);
  };
  const leave = () => {
    stopSpeech();
    onBack();
  };
  const beginCharacters = () => { stopSpeech(); setStage("characters"); };
  const backToFoundation = () => { stopSpeech(); setStage("foundation"); };

  return (
    <section className="h-[min(94vh,64rem)] space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
      <HanziScreenHeader title="拼音学习" subtitle="先认基础，再练拼读" onBack={leave} />
      {stage === "foundation" ? (
        <PinyinFoundationBoard playPinyinClip={playStaticPinyin} playPinyinSequence={playStaticSequence} speakExample={speak} onComplete={beginCharacters} />
      ) : (
        <SyllableStage childId={childId} speak={speak} speakExact={speakExactPinyin} stopSpeech={stopSpeech} onFoundation={backToFoundation} />
      )}
    </section>
  );
}

function SyllableStage({ childId, speak, speakExact, stopSpeech, onFoundation }: { childId: string; speak: (text: string) => void; speakExact: (ssml: string, fallback: string) => void; stopSpeech: () => void; onFoundation: () => void }) {
  const [cursor, setCursor] = useState(0);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const saved = Number.parseInt(window.localStorage.getItem(`${CURSOR_KEY}:${childId}`) ?? "0", 10);
    setCursor(Number.isFinite(saved) ? saved % PINYIN_SYLLABLES.length : 0);
    setReady(true);
  }, [childId]);
  const lesson = useMemo(() => Array.from({ length: LESSON_SIZE }, (_, offset) => PINYIN_SYLLABLES[(cursor + offset) % PINYIN_SYLLABLES.length]), [cursor]);
  const item = lesson[index];
  const choices = useMemo(() => shufflePinyinChoices(buildSyllableChoices(item)), [item]);
  const onSelect = (choice: string) => {
    stopSpeech();
    setSelected(choice);
  };
  useEffect(() => {
    if (item && ready) speak("请听一听，找出正确的拼音。");
    // Only the current question should trigger narration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.syllable, ready]);

  if (!ready) return <div className="py-10 text-center font-bold text-slate-400">正在准备拼音题…</div>;
  if (!item || done) return <div className="space-y-4 py-8 text-center"><div className="text-6xl">🎉</div><h3 className="text-2xl font-black text-slate-800">第二阶段完成！</h3><p className="font-bold text-slate-500">本次完成 10 个拼音，下一关继续新组合。</p><Btn onClick={onFoundation}>回到拼音表</Btn></div>;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onFoundation} className="text-sm font-black text-sky-600">← 第一阶段</button>
        <span className="text-sm font-black text-purple-600">第二阶段 · 拼音组合 {index + 1}/{lesson.length}</span>
      </div>
      <div className="rounded-[2rem] bg-purple-50 p-6 text-center ring-1 ring-purple-100">
        <div className="text-sm font-black text-purple-500">{item.family === "零声母" ? "整体拼读" : `声母 ${item.family}`}</div>
        <div className="mt-2 text-6xl font-black text-slate-800">{syllableParts(item).join(" + ")}</div>
        <p className="mt-2 text-lg font-bold text-slate-500">它们拼成什么？</p>
        <Btn className="mt-3" variant="secondary" onClick={() => speakExact(syllableSsml(item.syllable), item.syllable)}>🔊 听一听</Btn>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice) => (
          <button key={choice} type="button" onClick={() => onSelect(choice)} className={`rounded-3xl p-5 text-xl font-black ring-2 ${selected === choice ? (choice === item.syllable ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : "bg-rose-50 text-rose-600 ring-rose-200") : "bg-white text-slate-700 ring-slate-100"}`}>
            {choice}
          </button>
        ))}
      </div>
      {selected ? <div className="text-center"><p className="mb-3 font-black text-slate-600">{selected === item.syllable ? "答对啦！🌟" : `正确拼音是 ${item.syllable}`}</p><Btn onClick={() => { setSelected(null); if (index + 1 >= lesson.length) { window.localStorage.setItem(`${CURSOR_KEY}:${childId}`, String((cursor + LESSON_SIZE) % PINYIN_SYLLABLES.length)); setDone(true); } else setIndex((value) => value + 1); }}>{index + 1 >= lesson.length ? "完成练习 ✓" : "下一个"}</Btn></div> : null}
    </div>
  );
}

function buildSyllableChoices(answer?: PinyinSyllable): string[] {
  if (!answer) return [];
  const choices = [answer.syllable];
  const familyItems = PINYIN_SYLLABLES.filter((item) => item.family === answer.family);
  for (const item of [...familyItems, ...PINYIN_SYLLABLES]) {
    if (!choices.includes(item.syllable)) choices.push(item.syllable);
    if (choices.length === 4) break;
  }
  return choices;
}

function syllableParts(item: PinyinSyllable): string[] {
  if (item.family === "零声母") return [item.syllable];
  return [item.family, item.syllable.slice(item.family.length)];
}

function syllableSsml(syllable: string): string {
  return `<speak><phoneme alphabet="py" ph="${syllable}1">拼音</phoneme></speak>`;
}
