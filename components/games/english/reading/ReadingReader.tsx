"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BackButton } from "@/components/BackButton";
import { speakEnglishClip, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { gradeAttempt } from "@/content/english/encourage";
import type { BilingualStory } from "@/content/reading/types";
import {
  activeIllustrationIndex as pickActiveIllustrationIndex,
  currentTokenIndex,
  illustrationSentenceIndex,
  nextSubtitleMode,
  readingProgressValue,
  splitEnglishWords,
  splitHanChars,
  type SubtitleMode,
} from "@/lib/reading/player";
import { matchSpokenSentence } from "@/lib/reading/match";
import { SpeakPanel } from "../SpeakPanel";

const RATES = [0.75, 1, 1.25] as const;
const EN_WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;
type Feedback = null | "correct" | "retry" | "soft";

// The bilingual reader for one story. Two ways to engage, both on the same sentence list:
//   • 通读全文 — plays every sentence's Polly clip in order, highlighting the current line (passive
//     listen-along; row mics are locked so they don't fight the read-through audio).
//   • per-sentence 跟读 — each row's SpeakPanel: 🔊 hear it, 🎤 read it back (judged leniently).
// Chinese is hidden per sentence until 「看中文」. Finishing the follow-along of every sentence shows a
// celebration. (Pilot: no stars/session reporting yet — kept to the pure reading experience.)
export function ReadingReader({
  story,
  onBack,
}: {
  story: BilingualStory;
  onBack: () => void;
}) {
  const { sentences } = story;
  const [rate, setRate] = useState<number>(1);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [reading, setReading] = useState(false);
  const [clipFraction, setClipFraction] = useState(0);
  const [passed, setPassed] = useState<ReadonlySet<string>>(() => new Set());
  const [attemptsById, setAttemptsById] = useState<Readonly<Record<string, number>>>({});
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [subtitleMode, setSubtitleMode] = useState<SubtitleMode>("both");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenRef = useRef<SpeechController | null>(null);
  const activeSentence = sentences[sentenceIndex] ?? sentences[0];
  const activeId = activeSentence?.id ?? null;

  const allPassed = useMemo(
    () => sentences.every((s) => passed.has(s.id)),
    [sentences, passed],
  );
  const sentenceIds = useMemo(() => sentences.map((s) => s.id), [sentences]);
  const illustrationAnchors = useMemo(
    () => story.illustrations?.map((pic) => pic.fromSentenceId) ?? [],
    [story.illustrations],
  );
  const activeIllustrationIndex = useMemo(() => {
    return pickActiveIllustrationIndex(sentenceIds, illustrationAnchors, sentenceIndex);
  }, [illustrationAnchors, sentenceIds, sentenceIndex]);
  const englishWords = useMemo(
    () => splitEnglishWords(activeSentence?.en ?? ""),
    [activeSentence],
  );
  const chineseChars = useMemo(() => splitHanChars(activeSentence?.zh ?? ""), [activeSentence]);
  const activeEnglishWord = currentTokenIndex(englishWords.length, clipFraction);
  const activeChineseChar = currentTokenIndex(chineseChars.length, clipFraction);

  const { sfx } = useSFX();

  const stopPlayer = () => {
    setReading(false);
    audioRef.current?.pause();
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
      listenRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    setClipFraction(0);
    if (!activeSentence) return;
    const audio = new Audio(activeSentence.audio);
    audioRef.current = audio;
    audio.playbackRate = rate;
    audio.ontimeupdate = () => {
      if (audio.duration > 0) setClipFraction(audio.currentTime / audio.duration);
    };
    audio.onended = () => {
      setClipFraction(1);
      if (sentenceIndex < sentences.length - 1) {
        setSentenceIndex((i) => Math.min(sentences.length - 1, i + 1));
      } else {
        setReading(false);
      }
    };
    audio.onerror = () => setReading(false);
    if (reading) {
      void audio.play().catch(() => setReading(false));
    }
    return () => {
      audio.pause();
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
    };
  }, [activeSentence, reading, rate, sentenceIndex, sentences.length]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        goToSentence(sentenceIndex + 1, reading);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        goToSentence(sentenceIndex - 1, reading);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reading, sentenceIndex]);

  const goToSentence = (nextIndex: number, keepPlaying = reading) => {
    const clamped = Math.min(sentences.length - 1, Math.max(0, nextIndex));
    setSentenceIndex(clamped);
    setClipFraction(0);
    setFeedback(null);
    setReading(keepPlaying);
  };

  const togglePlayer = () => {
    stopSpeaking();
    if (reading) {
      stopPlayer();
    } else {
      sfx.pageFlip();
      setReading(true);
      void audioRef.current?.play().catch(() => setReading(false));
    }
  };

  const markPassed = (id: string) => {
    setPassed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const listenToActiveSentence = (): SpeechController => {
    listenRef.current?.stop();
    audioRef.current?.pause();
    setReading(false);
    const ctrl = speakEnglishClip(activeSentence.audio, activeSentence.en, { rate });
    listenRef.current = ctrl;
    return ctrl;
  };

  const onSpoken = (transcript: string | null) => {
    if (!activeSentence || passed.has(activeSentence.id)) return;
    if (transcript === null) {
      sfx.correct();
      setFeedback("soft");
      markPassed(activeSentence.id);
      return;
    }
    const ok = matchSpokenSentence(transcript, activeSentence.en).passed;
    const attemptNo = (attemptsById[activeSentence.id] ?? 0) + 1;
    const outcome = gradeAttempt(ok, attemptNo);
    setAttemptsById((prev) => ({ ...prev, [activeSentence.id]: attemptNo }));
    if (outcome === "correct") {
      sfx.correct();
      setFeedback("correct");
      markPassed(activeSentence.id);
    } else if (outcome === "retry") {
      sfx.wrong();
      setFeedback("retry");
      listenRef.current = listenToActiveSentence();
    } else {
      sfx.coin();
      setFeedback("soft");
      markPassed(activeSentence.id);
    }
  };

  const goToIllustration = (nextIllustrationIndex: number) => {
    const target = illustrationSentenceIndex(sentenceIds, illustrationAnchors, nextIllustrationIndex);
    goToSentence(target, reading);
  };

  const passedCount = passed.size;
  const total = sentences.length;
  const progressValue = readingProgressValue(sentenceIndex, clipFraction);
  const showEnglish = subtitleMode === "both" || subtitleMode === "english";
  const showChinese = subtitleMode === "both" || subtitleMode === "chinese";
  const subtitleLabel =
    subtitleMode === "both"
      ? "字幕：双语"
      : subtitleMode === "english"
        ? "字幕：英文"
        : subtitleMode === "chinese"
          ? "字幕：中文"
          : "字幕：隐藏";
  let englishWordOffset = 0;
  let chineseHanOffset = 0;

  return (
    <div>
      <header className="flex flex-wrap items-center gap-3">
        <BackButton label="返回书架" onClick={onBack} />
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {story.emoji} {story.titleEn}
          </h2>
          <p className="text-sm font-bold text-slate-400">{story.titleZh}</p>
        </div>
      </header>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
        <div className="relative aspect-square bg-emerald-50 sm:aspect-[16/9]">
          {story.illustrations?.map((pic, i) => (
            <img
              key={pic.src}
              src={pic.src}
              alt={pic.alt}
              width={1254}
              height={1254}
              loading={i === activeIllustrationIndex ? "eager" : "lazy"}
              decoding="async"
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === activeIllustrationIndex ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          <div className="absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-slate-600 shadow">
            {sentenceIndex + 1}/{total}
          </div>
          <button
            type="button"
            onClick={() => goToIllustration(activeIllustrationIndex - 1)}
            className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize bg-transparent"
            aria-label="上一张插图"
          />
          <button
            type="button"
            onClick={() => goToIllustration(activeIllustrationIndex + 1)}
            className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize bg-transparent"
            aria-label="下一张插图"
          />
        </div>

        <div className="space-y-4 p-4">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setSubtitleMode((mode) => nextSubtitleMode(mode))}
              className="rounded-full bg-white px-4 py-1.5 text-xs font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 active:scale-95"
            >
              {subtitleLabel}
            </button>
          </div>

          <div className="min-h-[7rem] rounded-2xl bg-slate-50 p-4 text-center">
            {showEnglish && (
              <p className="text-xl font-black leading-relaxed text-slate-800 sm:text-2xl">
                {activeSentence?.en.split(EN_WORD_RE).flatMap((part, i, gaps) => {
                  if (!activeSentence) return [];
                  const words = activeSentence.en.match(EN_WORD_RE) ?? [];
                  const word = words[i];
                  const nodes = [<span key={`gap-${i}`}>{part}</span>];
                  if (word) {
                    const wordIndex = englishWordOffset;
                    englishWordOffset += 1;
                    nodes.push(
                      <span
                        key={`word-${i}`}
                        className={`rounded-md px-0.5 transition ${
                          wordIndex === activeEnglishWord ? "bg-amber-200 text-amber-950" : ""
                        }`}
                      >
                        {word}
                      </span>,
                    );
                  }
                  return i === gaps.length - 1 ? [nodes[0]] : nodes;
                })}
              </p>
            )}
            {showChinese && (
              <p
                className={`text-lg font-bold leading-relaxed text-slate-500 sm:text-xl ${
                  showEnglish ? "mt-3" : ""
                }`}
              >
                {Array.from(activeSentence?.zh ?? "").map((char, i) => {
                  const isHan = /\p{Script=Han}/u.test(char);
                  const hanIndex = isHan ? chineseHanOffset : -1;
                  if (isHan) chineseHanOffset += 1;
                  return (
                    <span
                      key={`${char}-${i}`}
                      className={`rounded px-0.5 transition ${
                        hanIndex === activeChineseChar ? "bg-sky-200 text-sky-950" : ""
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>
            )}
            {!showEnglish && !showChinese && (
              <p className="py-8 text-sm font-bold text-slate-400">字幕已隐藏</p>
            )}
          </div>

          <input
            type="range"
            min={0}
            max={total}
            step={0.01}
            value={progressValue}
            onChange={(event) => goToSentence(Math.floor(Number(event.currentTarget.value)))}
            className="h-2 w-full accent-emerald-500"
            aria-label="阅读进度"
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => goToSentence(sentenceIndex - 1)}
                className="rounded-full bg-white px-4 py-2 text-base font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition active:scale-95"
              >
                ← 上一句
              </button>
              <button
                type="button"
                onClick={togglePlayer}
                className={`rounded-full px-5 py-2 text-base font-black text-white shadow transition active:scale-95 ${
                  reading ? "bg-rose-500" : "bg-emerald-500"
                }`}
              >
                {reading ? "⏸ 暂停" : "▶ 播放"}
              </button>
              <button
                type="button"
                onClick={() => goToSentence(sentenceIndex + 1)}
                className="rounded-full bg-white px-4 py-2 text-base font-black text-slate-600 shadow-sm ring-1 ring-slate-200 transition active:scale-95"
              >
                下一句 →
              </button>
              <div className="flex items-center gap-2">
                <SpeakPanel
                  say={activeSentence.en}
                  lang="en-US"
                  onListen={listenToActiveSentence}
                  onSpoken={onSpoken}
                  disabled={reading || passed.has(activeSentence.id)}
                />
                <span className="min-h-5 text-sm font-bold">
                  {feedback === "correct" && <span className="text-emerald-500">读得真棒！🎉</span>}
                  {feedback === "retry" && <span className="text-amber-500">再试一次～</span>}
                  {feedback === "soft" && <span className="text-sky-500">很好，我们继续！👍</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="mr-1 text-xs font-bold text-slate-400">语速</span>
              {RATES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRate(r)}
                  className={`rounded-full px-3 py-1 text-sm font-bold transition ${
                    rate === r
                      ? "bg-purple-500 text-white"
                      : "bg-white text-slate-500 ring-1 ring-slate-200"
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{ width: `${total ? (passedCount / total) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-bold text-slate-400">
          跟读 {passedCount}/{total}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {sentences.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => goToSentence(i, false)}
            className={`h-8 w-8 rounded-full text-xs font-black transition ${
              i === sentenceIndex
                ? "bg-amber-400 text-white"
                : "bg-white text-slate-400 ring-1 ring-slate-100"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {allPassed && (
        <div className="anim-pop-in mt-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-center text-white shadow-lg">
          <p className="text-xl font-black">🎉 全部读完啦，你真棒！</p>
          <p className="mt-1 text-sm font-bold text-white/90">You finished the whole story!</p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-400">
        没有麦克风也能玩：跟读会自动切到「👍 我说好了」。
      </p>
    </div>
  );
}
