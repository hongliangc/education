"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { speakTextStream, type SpeechController } from "@/lib/speech";
import type { Storyboard } from "@/content/math/scene";
import { SceneStage } from "./ten-frame/SceneStage";

// Shared with MathGuide so muting the guide also mutes the animation and vice versa.
const MUTE_KEY = "mlk:mathGuideMuted";

type Status = "idle" | "playing" | "paused" | "done";

// Narrated, animated ten-frame storyboard (凑十法 / 破十法). The scene is pure data; this component
// owns playback: it walks the beats, drives the SVG via `step`, and narrates each beat with
// streaming TTS, advancing when the voice ends (with a fallback timer). `autoStart` kicks the
// sequence off on mount (lesson mode); `onComplete` fires once the last beat finishes.
export function MathScene({
  scene,
  autoStart = false,
  onComplete,
}: {
  scene: Storyboard;
  autoStart?: boolean;
  onComplete?: () => void;
}) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [muted, setMuted] = useState(false);

  const speechRef = useRef<SpeechController | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const tokenRef = useRef(0);
  // Mirror of `muted` read synchronously so an autoStart that fires before the muted state has
  // committed still honors a previously-saved preference.
  const mutedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // How to continue the current beat after a pause: resume its audio, finish its inter-beat gap,
  // or wait out its muted timer. Set as the beat plays; resume() just invokes it. Null after a
  // hard stop / when done, so resume() then restarts the current beat instead.
  const continueRef = useRef<(() => void) | null>(null);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  // Hard stop ends the whole sequence: kill audio, clear timers, and bump the token so every
  // in-flight onEnd / fallback / late-attaching audio for the old sequence bails. Used by
  // play/restart/jump/reset — NOT by pause (pause keeps the sequence alive so it can resume).
  const hardStop = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = null;
    continueRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    tokenRef.current += 1;
  }, []);

  useEffect(() => {
    const m = window.localStorage.getItem(MUTE_KEY) === "true";
    mutedRef.current = m;
    setMuted(m);
    return hardStop;
  }, [hardStop]);

  // Walk the storyboard beat by beat, advancing when the narration for each beat finishes
  // (with a fallback timer so a missing onEnd never strands playback).
  const runStep = useCallback(
    (i: number, token: number) => {
      if (tokenRef.current !== token) return;
      setStep(i);
      let advanced = false;
      const advance = () => {
        if (advanced || tokenRef.current !== token) return; // stale guard for restart/reset
        advanced = true;
        if (i + 1 < scene.steps.length) {
          const goNext = () => runStep(i + 1, token);
          // We're now in the inter-beat gap; a pause here should resume the gap, not the audio.
          continueRef.current = () => timersRef.current.push(setTimeout(goNext, 480));
          timersRef.current.push(setTimeout(goNext, 480));
        } else {
          continueRef.current = null;
          setStatus("done");
          onCompleteRef.current?.();
        }
      };
      if (mutedRef.current) {
        continueRef.current = () => timersRef.current.push(setTimeout(advance, 2200));
        timersRef.current.push(setTimeout(advance, 2200));
        return;
      }
      // Natural pitch (no playbackRate): time-stretching short MSE clips warbles their tail.
      speechRef.current = speakTextStream(scene.steps[i].caption, { lang: "zh-CN", onEnd: advance });
      // Paused mid-sentence: the browser keeps the buffer, so resume() continues from the exact
      // spot (the shared player honors a pause requested during initial buffering too).
      continueRef.current = () => {
        speechRef.current?.resume();
        timersRef.current.push(setTimeout(advance, 9000));
      };
      timersRef.current.push(setTimeout(advance, 9000));
    },
    [scene],
  );

  const playFrom = useCallback(
    (i: number) => {
      hardStop();
      setStatus("playing");
      runStep(i, tokenRef.current);
    },
    [hardStop, runStep],
  );

  // Reset whenever the problem changes (preset switch / new question). In lesson mode (autoStart)
  // the new storyboard starts playing immediately; otherwise it waits behind the ▶ overlay.
  useEffect(() => {
    hardStop();
    setStep(0);
    if (autoStart) {
      setStatus("playing");
      runStep(0, tokenRef.current);
    } else {
      setStatus("idle");
    }
  }, [scene, autoStart, hardStop, runStep]);

  // Pause keeps everything alive: just freeze the audio and suspend the pending timers. The token
  // is NOT bumped, so the beat's advance closure stays valid for resume() to pick back up.
  const pause = () => {
    if (status !== "playing") return;
    speechRef.current?.pause();
    clearTimers();
    setStatus("paused");
  };

  const resume = () => {
    if (status !== "paused") return;
    setStatus("playing");
    if (continueRef.current) continueRef.current();
    else playFrom(step); // paused after a manual jump → restart this beat
  };

  // Manual step inspection: jump to a beat, speak just it, and stay paused there.
  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(scene.steps.length - 1, i));
    hardStop();
    setStatus("paused");
    setStep(clamped);
    if (!mutedRef.current) {
      speechRef.current = speakTextStream(scene.steps[clamped].caption, { lang: "zh-CN" });
    }
  };

  const toggleMuted = () => {
    const next = !muted;
    window.localStorage.setItem(MUTE_KEY, String(next));
    mutedRef.current = next;
    setMuted(next);
    if (next) speechRef.current?.stop();
  };

  const mainButton: { label: string; onClick: () => void } =
    status === "playing"
      ? { label: "⏸ 暂停", onClick: pause }
      : status === "paused"
        ? { label: "▶ 继续", onClick: resume }
        : status === "done"
          ? { label: "▶ 再看一遍", onClick: () => playFrom(0) }
          : { label: "▶ 播放", onClick: () => playFrom(0) };

  return (
    <div className="rounded-[28px] bg-gradient-to-b from-sky-50 to-amber-50 p-5 ring-1 ring-amber-100 shadow-sm">
      <div className="relative">
        <SceneStage scene={scene} step={step} />
        {status === "idle" && (
          <button
            type="button"
            onClick={() => playFrom(0)}
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/10 backdrop-blur-[1px]"
            aria-label="播放讲解动画"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-lg ring-4 ring-amber-300 transition-transform hover:scale-105">
              ▶
            </span>
          </button>
        )}
      </div>

      {/* fairy narration line for the current beat */}
      <p className="mt-3 min-h-[3rem] rounded-2xl bg-white/80 px-4 py-3 text-center text-base font-bold leading-6 text-slate-700 ring-1 ring-sky-100">
        {scene.steps[step].caption}
      </p>

      {/* beat progress dots */}
      <div className="mt-3 flex justify-center gap-2">
        {scene.steps.map((s, i) => (
          <span
            key={s.id}
            className={`h-2.5 rounded-full transition-all ${
              i === step ? "w-6 bg-amber-500" : "w-2.5 bg-amber-200"
            }`}
          />
        ))}
      </div>

      {/* controls */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          disabled={step === 0}
          className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
        >
          ◀ 上一步
        </button>
        <button
          type="button"
          onClick={mainButton.onClick}
          className="rounded-full bg-amber-500 px-5 py-2 text-sm font-bold text-white shadow hover:bg-amber-600"
        >
          {mainButton.label}
        </button>
        <button
          type="button"
          onClick={() => goTo(step + 1)}
          disabled={step === scene.steps.length - 1}
          className="rounded-full bg-white px-3 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200 disabled:opacity-40"
        >
          下一步 ▶
        </button>
        <button
          type="button"
          onClick={toggleMuted}
          className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600"
          aria-label={muted ? "打开讲解声音" : "关闭讲解声音"}
        >
          {muted ? "🔇 静音" : "🔊 有声"}
        </button>
      </div>
    </div>
  );
}
