"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { speakText, type SpeechController } from "@/lib/speech";
import type { MathProblem } from "@/content/math";
import { buildGuideText, getGuideStepCount } from "./guideText";
import { MathVisual } from "./MathVisual";

const MUTE_KEY = "mlk:mathGuideMuted";

export function MathGuide({
  problem,
  onComplete,
}: {
  problem: MathProblem;
  onComplete: () => void;
}) {
  const [guideStep, setGuideStep] = useState(0);
  const [muted, setMuted] = useState(false);
  const controllerRef = useRef<SpeechController | null>(null);
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const playbackRef = useRef(0);
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  const clearPlayback = useCallback(() => {
    controllerRef.current?.stop();
    controllerRef.current = null;
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const play = useCallback(() => {
    clearPlayback();
    const playback = ++playbackRef.current;
    const stepCount = getGuideStepCount(problem);
    const animationDuration = 2600;
    setGuideStep(0);

    Array.from({ length: stepCount }, (_, index) => index + 1).forEach((step) => {
      timersRef.current.push(
        setTimeout(() => {
          if (playbackRef.current === playback) setGuideStep(step);
        }, step * (animationDuration / stepCount)),
      );
    });

    let finished = false;
    let animationDone = false;
    let speechDone = muted;
    const finishIfReady = () => {
      if (finished) return;
      if (playbackRef.current !== playback) return;
      if (!animationDone || !speechDone) return;
      finished = true;
      timersRef.current.push(
        setTimeout(() => {
          if (playbackRef.current === playback) completeRef.current();
        }, 700),
      );
    };

    timersRef.current.push(
      setTimeout(() => {
        animationDone = true;
        finishIfReady();
      }, animationDuration),
    );

    if (muted) return;

    controllerRef.current = speakText(buildGuideText(problem), {
      lang: "zh-CN",
      rate: 0.88,
      onEnd: () => {
        speechDone = true;
        finishIfReady();
      },
    });
    timersRef.current.push(
      setTimeout(() => {
        speechDone = true;
        finishIfReady();
      }, 10000),
    );
  }, [clearPlayback, muted, problem]);

  useEffect(() => {
    setMuted(window.localStorage.getItem(MUTE_KEY) === "true");
  }, []);

  useEffect(() => {
    play();
    return clearPlayback;
  }, [clearPlayback, play]);

  const toggleMuted = () => {
    const next = !muted;
    window.localStorage.setItem(MUTE_KEY, String(next));
    setMuted(next);
  };

  return (
    <div className="mt-4 rounded-3xl bg-white/85 p-4 ring-2 ring-amber-300 anim-pop-in">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-amber-700">别着急，我们一步一步看</p>
        <button
          type="button"
          onClick={toggleMuted}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600"
          aria-label={muted ? "打开讲解声音" : "关闭讲解声音"}
        >
          {muted ? "🔇 静音" : "🔊 有声"}
        </button>
      </div>
      <div className="mt-4 min-h-28">
        <MathVisual problem={problem} guideStep={guideStep} />
      </div>
      <p className="mt-3 text-center text-sm leading-6 text-slate-600">{buildGuideText(problem)}</p>
      <div className="mt-3 text-center">
        <Btn size="sm" variant="ghost" onClick={play}>
          再看一遍 🔁
        </Btn>
      </div>
    </div>
  );
}
