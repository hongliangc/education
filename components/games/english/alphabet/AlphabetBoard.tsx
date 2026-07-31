"use client";

import { useEffect, useRef, useState } from "react";
import { ALPHABET, type AlphabetEntry } from "@/content/english/alphabet";
import { speakEnglishSequence, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { gradeAttempt } from "@/content/english/encourage";
import { matchSpokenWord } from "@/content/english/match";
import { GameModal } from "@/components/GameModal";
import { MODULE_META } from "@/lib/utils";
import { SpeakPanel } from "../SpeakPanel";
import { PopoverBoard } from "../PopoverBoard";
import { LetterTracePad } from "./LetterTracePad";

type Feedback = "correct" | "retry" | "soft" | null;

// 一屏 26 字母总览：宽松排版，点一个字母就在它所在位置浮出毛玻璃大卡片（发音 + 跟读）。
// 听一遍 = 字母名 → 例词（去掉中间「拼读音」那段，沿用反馈①）。
export function AlphabetBoard() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [tracing, setTracing] = useState(false);
  const attemptsRef = useRef(0);
  const speechRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(() => () => {
    speechRef.current?.stop();
    stopSpeaking();
  }, []);

  const playLetter = (entry: AlphabetEntry): SpeechController => {
    speechRef.current?.stop();
    const controller = speakEnglishSequence(
      [
        { text: entry.name, rate: 0.85 },
        { text: entry.word, rate: 0.85 },
      ],
      { gapMs: 340 },
    );
    speechRef.current = controller;
    return controller;
  };

  const open = openIndex == null ? null : ALPHABET[openIndex];

  const handleOpen = (index: number | null) => {
    setOpenIndex(index);
    setFeedback(null);
    setTracing(false);
    attemptsRef.current = 0;
    if (index != null) playLetter(ALPHABET[index]); // 点开即示范一遍
  };

  const onSpoken = (transcript: string | null) => {
    if (!open || feedback === "correct" || feedback === "soft") return;
    if (transcript === null) {
      sfx.coin();
      setFeedback("soft");
      return;
    }
    const ok = matchSpokenWord(transcript, [{ id: open.letter, en: open.word }]).matched;
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
        <p className="text-sm font-bold text-amber-500">🔤 26 个英文字母</p>
        <h2 className="mt-1 text-lg font-black text-slate-800">点一个字母，看大卡片 · 听发音 · 跟读</h2>
      </div>

      <PopoverBoard
        openIndex={openIndex}
        onOpenChange={handleOpen}
        className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-7"
        renderPopover={(index) => (
          <AlphabetCard
            entry={ALPHABET[index]}
            feedback={feedback}
            onClose={() => handleOpen(null)}
            onListen={() => playLetter(ALPHABET[index])}
            onSpoken={onSpoken}
            onTrace={() => setTracing(true)}
          />
        )}
      >
        {(active) =>
          ALPHABET.map((entry, index) => {
            const isActive = index === active;
            return (
              <button
                key={entry.letter}
                type="button"
                data-tile-index={index}
                className={`flex select-none flex-col items-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 px-1 py-4 ring-1 transition active:scale-95 ${
                  isActive
                    ? "z-10 scale-[1.04] shadow-lg ring-2 ring-amber-400"
                    : "ring-amber-200 hover:ring-amber-300"
                }`}
              >
                <span className="text-2xl font-black leading-none text-orange-600">
                  {entry.letter}
                  <span className="text-lg text-amber-500">{entry.lower}</span>
                </span>
                <span className="mt-1 text-2xl">{entry.emoji}</span>
                <span className="mt-1 text-[11px] font-black text-slate-600">{entry.word}</span>
              </button>
            );
          })
        }
      </PopoverBoard>

      <p className="mt-4 text-center text-sm text-slate-400">点字母看详情，点空白或再点一次收起～</p>

      {open && tracing ? (
        <GameModal
          title={`${open.letter}${open.lower} 描红`}
          emoji="✍️"
          color={MODULE_META.ALPHABET.color}
          onClose={() => setTracing(false)}
        >
          <LetterTracePad entry={open} />
        </GameModal>
      ) : null}
    </div>
  );
}

function AlphabetCard({
  entry,
  feedback,
  onClose,
  onListen,
  onSpoken,
  onTrace,
}: {
  entry: AlphabetEntry;
  feedback: Feedback;
  onClose: () => void;
  onListen: () => SpeechController;
  onSpoken: (transcript: string | null) => void;
  onTrace: () => void;
}) {
  return (
    <div className="relative rounded-3xl bg-white/80 p-4 text-center shadow-2xl ring-1 ring-white/70 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/80 text-base font-black text-slate-500 ring-1 ring-slate-200 transition hover:bg-white focus-visible:ring-4 focus-visible:ring-amber-300"
        aria-label="关闭"
      >
        ✕
      </button>
      <p className="text-xs font-black tracking-wider text-amber-500">All about</p>
      <div className="text-6xl font-black leading-none text-orange-600">
        {entry.letter}
        <span className="text-4xl text-amber-500">{entry.lower}</span>
      </div>
      <div className="mt-1 font-mono text-lg font-black text-rose-500">{entry.soundIpa}</div>
      <div className="mt-2 text-6xl">{entry.emoji}</div>
      <div className="mt-1 text-2xl font-black text-slate-800">{entry.word}</div>
      <div className="mt-3">
        <SpeakPanel
          say={entry.word}
          onListen={onListen}
          onSpoken={onSpoken}
          disabled={feedback === "correct" || feedback === "soft"}
        />
      </div>
      <div className="mt-2 h-6 text-base font-bold" aria-live="polite">
        {feedback === "correct" ? <span className="text-emerald-500">读得真棒！🎉</span> : null}
        {feedback === "retry" ? <span className="text-amber-500">再听一次，慢慢读～ 🔁</span> : null}
        {feedback === "soft" ? <span className="text-sky-500">很好，我们继续！👍</span> : null}
      </div>
      <button
        type="button"
        onClick={onTrace}
        className="mt-1 w-full rounded-2xl bg-blue-500 px-4 py-2.5 text-base font-black text-white shadow-sm ring-2 ring-blue-200 transition active:scale-95"
      >
        ✍️ 手写练习
      </button>
    </div>
  );
}
