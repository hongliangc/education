"use client";

import { useEffect, useRef, useState } from "react";
import {
  IPA_GROUPS,
  IPA_PHONEMES,
  exampleWords,
  groupInfo,
  phonemesInGroup,
  type Phoneme,
  type PhonemeGroup,
} from "@/content/english/ipa";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { gradeAttempt } from "@/content/english/encourage";
import { matchSpokenWord } from "@/content/english/match";
import { SpeakPanel } from "../SpeakPanel";
import { PopoverBoard } from "../PopoverBoard";
import { ExampleChainButton } from "./GroupChant";

type Feedback = "correct" | "retry" | "soft" | null;

// 每个分类一条彩色带：边框 + 背景色各不相同，自带口诀和「整组连读」。
const GROUP_STYLE: Record<PhonemeGroup, { emoji: string; band: string; tile: string; label: string; chant: string }> = {
  长元音: { emoji: "🎵", band: "bg-rose-50 ring-rose-200", tile: "ring-rose-200", label: "text-rose-600", chant: "bg-rose-500" },
  短元音: { emoji: "✨", band: "bg-amber-50 ring-amber-200", tile: "ring-amber-200", label: "text-amber-600", chant: "bg-amber-500" },
  双元音: { emoji: "🌈", band: "bg-fuchsia-50 ring-fuchsia-200", tile: "ring-fuchsia-200", label: "text-fuchsia-600", chant: "bg-fuchsia-500" },
  爆破音: { emoji: "💥", band: "bg-sky-50 ring-sky-200", tile: "ring-sky-200", label: "text-sky-600", chant: "bg-sky-500" },
  摩擦音: { emoji: "🌬️", band: "bg-cyan-50 ring-cyan-200", tile: "ring-cyan-200", label: "text-cyan-600", chant: "bg-cyan-500" },
  破擦音: { emoji: "🚂", band: "bg-indigo-50 ring-indigo-200", tile: "ring-indigo-200", label: "text-indigo-600", chant: "bg-indigo-500" },
  鼻音: { emoji: "👃", band: "bg-violet-50 ring-violet-200", tile: "ring-violet-200", label: "text-violet-600", chant: "bg-violet-500" },
  半元音: { emoji: "🛝", band: "bg-emerald-50 ring-emerald-200", tile: "ring-emerald-200", label: "text-emerald-600", chant: "bg-emerald-500" },
};

// 所有音素共享一个全局索引空间，供 PopoverBoard 定位。
const INDEX_OF: Record<string, number> = {};
IPA_PHONEMES.forEach((phoneme, index) => {
  INDEX_OF[phoneme.id] = index;
});

export function IpaBoard() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const attemptsRef = useRef(0);
  const speechRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(() => () => {
    speechRef.current?.stop();
    stopSpeaking();
  }, []);

  const playSound = (phoneme: Phoneme): SpeechController => {
    speechRef.current?.stop();
    const controller = speakText(phoneme.say, { lang: "en-US", rate: 0.7 });
    speechRef.current = controller;
    return controller;
  };

  const playWord = (word: string) => {
    speechRef.current?.stop();
    speechRef.current = speakText(word, { lang: "en-US", rate: 0.85 });
  };

  const open = openIndex == null ? null : IPA_PHONEMES[openIndex];

  const handleOpen = (index: number | null) => {
    setOpenIndex(index);
    setFeedback(null);
    attemptsRef.current = 0;
    if (index != null) playSound(IPA_PHONEMES[index]); // 点开即示范该音素
  };

  const onSpoken = (transcript: string | null) => {
    if (!open || feedback === "correct" || feedback === "soft") return;
    if (transcript === null) {
      sfx.coin();
      setFeedback("soft");
      return;
    }
    const candidates = exampleWords(open).map((word) => ({ id: word, en: word }));
    const ok = matchSpokenWord(transcript, candidates).matched;
    const attemptNumber = attemptsRef.current + 1;
    const outcome = gradeAttempt(ok, attemptNumber);
    if (outcome === "correct") {
      sfx.correct();
      setFeedback("correct");
    } else if (outcome === "retry") {
      sfx.wrong();
      attemptsRef.current = attemptNumber;
      setFeedback("retry");
    } else {
      sfx.coin();
      setFeedback("soft");
    }
  };

  return (
    <div>
      <div className="text-center">
        <p className="text-sm font-bold text-sky-500">🗣️ 完整国际音标 · 48 音</p>
        <h2 className="mt-1 text-lg font-black text-slate-800">点一个音标，看大卡片 · 听发音 · 跟读</h2>
      </div>

      <PopoverBoard
        openIndex={openIndex}
        onOpenChange={handleOpen}
        className="mt-5 space-y-3"
        renderPopover={(index) => (
          <PhonemeCard
            phoneme={IPA_PHONEMES[index]}
            feedback={feedback}
            onClose={() => handleOpen(null)}
            onListen={() => playSound(IPA_PHONEMES[index])}
            onPlayWord={playWord}
            onSpoken={onSpoken}
          />
        )}
      >
        {(active) =>
          IPA_GROUPS.map((group) => {
            const style = GROUP_STYLE[group];
            const phonemes = phonemesInGroup(group);
            const info = groupInfo(group);
            const groupWords = phonemes.map((item) => item.examples[0].word);
            return (
              <section key={group} className={`rounded-3xl p-3 ring-2 ${style.band}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-lg">{style.emoji}</span>
                  <span className={`text-sm font-black ${style.label}`}>{group}</span>
                  <span className="text-xs font-bold text-slate-400">{phonemes.length} 音</span>
                  <span className="text-xs font-bold text-slate-500">· {info.chant}</span>
                  <span className="ml-auto">
                    <ExampleChainButton words={groupWords} />
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                  {phonemes.map((phoneme) => {
                    const index = INDEX_OF[phoneme.id];
                    const isActive = index === active;
                    return (
                      <button
                        key={phoneme.id}
                        type="button"
                        data-tile-index={index}
                        className={`flex select-none flex-col items-center rounded-xl bg-white px-1 py-2 ring-1 transition active:scale-95 ${style.tile} ${
                          isActive ? "z-10 scale-[1.05] shadow-lg ring-2" : "hover:shadow-sm"
                        }`}
                      >
                        <span className={`font-mono text-base font-black leading-none ${style.label}`}>
                          {phoneme.symbol}
                        </span>
                        <span className="mt-1 text-lg">{phoneme.examples[0].emoji}</span>
                        <span className="mt-0.5 text-[10px] font-black text-slate-500">{phoneme.examples[0].word}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })
        }
      </PopoverBoard>

      <p className="mt-4 text-center text-sm text-slate-400">点音标看详情，点空白或再点一次收起～</p>
    </div>
  );
}

function PhonemeCard({
  phoneme,
  feedback,
  onClose,
  onListen,
  onPlayWord,
  onSpoken,
}: {
  phoneme: Phoneme;
  feedback: Feedback;
  onClose: () => void;
  onListen: () => SpeechController;
  onPlayWord: (word: string) => void;
  onSpoken: (transcript: string | null) => void;
}) {
  const example = phoneme.examples[0];
  const info = groupInfo(phoneme.group);
  const vowel = phoneme.kind === "vowel";

  return (
    <div className="relative rounded-3xl bg-white/80 p-4 text-center shadow-2xl ring-1 ring-white/70 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/70 text-sm font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-white"
        aria-label="关闭"
      >
        ✕
      </button>
      <div className={`font-mono text-5xl font-black ${vowel ? "text-rose-600" : "text-sky-600"}`}>
        {phoneme.symbol}
      </div>
      <div className="mt-2 text-5xl">{example.emoji}</div>
      <div className="mt-1 text-2xl font-black text-slate-800">{example.word}</div>
      <div className="text-sm font-bold text-slate-400">{example.zh}</div>
      <p className="mt-2 text-sm font-black text-slate-600">{phoneme.alliteration}</p>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => onPlayWord(example.word)}
          className="rounded-full bg-amber-400 px-4 py-2 text-base font-black text-white shadow-sm ring-2 ring-amber-200 transition active:scale-95"
          aria-label={`听例词 ${example.word}`}
        >
          🍎 听例词 · {example.word}
        </button>
      </div>
      <div className="mt-3">
        <SpeakPanel
          say={example.word}
          onListen={onListen}
          onSpoken={onSpoken}
          disabled={feedback === "correct" || feedback === "soft"}
        />
      </div>
      <div className="mt-2 h-6 text-base font-bold" aria-live="polite">
        {feedback === "correct" ? <span className="text-emerald-500">听得准，读得棒！🎉</span> : null}
        {feedback === "retry" ? <span className="text-amber-500">再听例词，试一次～ 🔁</span> : null}
        {feedback === "soft" ? <span className="text-sky-500">很好，我们继续！👍</span> : null}
      </div>
      <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 text-left text-xs font-bold leading-5 text-slate-500">
        📖 {info.story}
      </p>
    </div>
  );
}
