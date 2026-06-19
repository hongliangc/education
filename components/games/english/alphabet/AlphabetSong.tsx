"use client";

import { useEffect, useRef, useState } from "react";
import {
  ALPHABET,
  ALPHABET_SONG_LINES,
  ALPHABET_SONG_OUTRO,
} from "@/content/english/alphabet";
import { Btn } from "@/components/Btn";
import { speakEnglish, stopSpeaking, type SpeechController } from "@/lib/speech";

type SongStatus = "idle" | "playing" | "paused" | "complete";

const FLAT_LETTERS = ALPHABET_SONG_LINES.flat();
const LETTER_NAMES = new Map(ALPHABET.map((entry) => [entry.letter, entry.name]));
const LINE_ENDS = new Set(
  ALPHABET_SONG_LINES.map((line, index) =>
    ALPHABET_SONG_LINES.slice(0, index + 1).reduce((total, item) => total + item.length, 0) - 1,
  ),
);

function letterName(letter: string): string {
  const name = LETTER_NAMES.get(letter);
  if (!name) throw new Error(`Missing spoken name for letter ${letter}`);
  return name;
}

export function AlphabetSong({ onExit }: { onExit: () => void }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<SongStatus>("idle");
  const speechRef = useRef<SpeechController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(
    () => () => {
      runRef.current += 1;
      clearTimer();
      speechRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const finishSong = (run: number) => {
    if (runRef.current !== run) return;
    setActiveIndex(null);
    speechRef.current = speakEnglish(ALPHABET_SONG_OUTRO, {
      rate: 0.85,
      onEnd: () => {
        if (runRef.current !== run) return;
        speechRef.current = null;
        setStatus("complete");
      },
    });
  };

  const playLetter = (index: number, run: number) => {
    if (runRef.current !== run) return;
    if (index >= FLAT_LETTERS.length) {
      finishSong(run);
      return;
    }

    setActiveIndex(index);
    setStatus("playing");
    speechRef.current = speakEnglish(letterName(FLAT_LETTERS[index]), {
      rate: 0.82,
      onEnd: () => {
        if (runRef.current !== run) return;
        speechRef.current = null;
        const pause = LINE_ENDS.has(index) ? 320 : 110;
        timerRef.current = setTimeout(() => playLetter(index + 1, run), pause);
      },
    });
  };

  const restart = () => {
    runRef.current += 1;
    clearTimer();
    speechRef.current?.stop();
    stopSpeaking();
    const run = runRef.current;
    playLetter(0, run);
  };

  const pause = () => {
    speechRef.current?.pause();
    clearTimer();
    setStatus("paused");
  };

  const resume = () => {
    if (speechRef.current) {
      speechRef.current.resume();
      setStatus("playing");
      return;
    }
    const nextIndex = activeIndex ?? 0;
    const run = runRef.current;
    playLetter(nextIndex, run);
  };

  let flatIndex = 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Btn variant="ghost" onClick={onExit}>
          ← 字母表
        </Btn>
        <span className="text-sm font-black text-fuchsia-500">🎵 字母歌</span>
      </div>

      <section className="mt-4 rounded-3xl bg-gradient-to-br from-fuchsia-50 via-amber-50 to-sky-50 p-5 text-center ring-2 ring-fuchsia-100">
        <h2 className="text-2xl font-black text-slate-800">一起唱 ABC</h2>
        <p className="mt-1 text-sm font-bold text-slate-500">跟着亮起来的字母，有节奏地念到 Z！</p>

        <div className="mt-5 space-y-2">
          {ALPHABET_SONG_LINES.map((line, lineIndex) => (
            <div key={line.join("")} className="flex flex-wrap items-center justify-center gap-2">
              {line.map((letter, letterIndex) => {
                const index = flatIndex++;
                const active = index === activeIndex;
                const showAnd = lineIndex === ALPHABET_SONG_LINES.length - 1 && letterIndex === 1;
                return (
                  <span key={letter} className="flex items-center gap-2">
                    {showAnd ? <span className="text-sm font-black text-slate-400">and</span> : null}
                    <span
                      className={`flex size-10 items-center justify-center rounded-2xl text-xl font-black transition ${
                        active
                          ? "scale-110 bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-200"
                          : "bg-white text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {letter}
                    </span>
                  </span>
                );
              })}
            </div>
          ))}
        </div>

        <p className="mt-5 text-lg font-black text-fuchsia-600">{ALPHABET_SONG_OUTRO}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={status === "paused" ? resume : restart}
            disabled={status === "playing"}
            className="rounded-full bg-fuchsia-500 px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-40"
          >
            ▶ {status === "paused" ? "继续" : "一起唱"}
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={status !== "playing"}
            className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-black text-white shadow-sm disabled:opacity-40"
          >
            ⏸ 暂停
          </button>
          <button
            type="button"
            onClick={restart}
            className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-black text-white shadow-sm"
          >
            🔁 重唱
          </button>
        </div>
      </section>
    </div>
  );
}
