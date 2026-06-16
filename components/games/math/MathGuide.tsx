"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { speakTextStream, type SpeechController } from "@/lib/speech";
import type { MathProblem } from "@/content/math";
import { sceneForProblem } from "@/content/math/scene";
import { buildGuideText, getGuideStepCount } from "./guideText";
import { MathScene } from "./MathScene";
import { MathVisual } from "./MathVisual";

const MUTE_KEY = "mlk:mathGuideMuted";

// Picks the richer animated ten-frame walkthrough (凑十法 / 破十法) when the problem fits one, and
// otherwise falls back to the generic step-by-step guide. `useMemo` keeps the scene reference
// stable so MathScene doesn't restart playback on every parent re-render. Only one hook runs here
// before the branch, so the conditional return is hooks-safe (each branch mounts its own subtree).
//
// `autoPlay` distinguishes the two ways a guide opens: a wrong answer or the lesson demo plays
// itself through and moves on (autoPlay), while on-demand 求助 is self-paced — the child presses ▶
// and scrubs/replays at will (like the /math-demo player), then closes it themselves.
export function MathGuide({
  problem,
  onComplete,
  autoPlay = true,
}: {
  problem: MathProblem;
  onComplete: () => void;
  autoPlay?: boolean;
}) {
  const scene = useMemo(() => sceneForProblem(problem), [problem]);
  if (scene) {
    return (
      <div className="mt-4 anim-pop-in">
        <p className="mb-2 text-center font-bold text-amber-700">
          {autoPlay ? "别着急，看动画一步一步学 ✨" : "点 ▶ 看动画，自己慢慢学 ✨"}
        </p>
        <MathScene scene={scene} autoStart={autoPlay} onComplete={onComplete} />
      </div>
    );
  }
  return <StepByStepGuide problem={problem} onComplete={onComplete} autoPlay={autoPlay} />;
}

function StepByStepGuide({
  problem,
  onComplete,
  autoPlay,
}: {
  problem: MathProblem;
  onComplete: () => void;
  autoPlay: boolean;
}) {
  const [guideStep, setGuideStep] = useState(0);
  const [muted, setMuted] = useState(false);
  // Self-paced (求助) starts idle until the child presses ▶; auto-play starts immediately.
  const [started, setStarted] = useState(autoPlay);
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

    // Streaming TTS: first sound at ~0.6s instead of waiting for the whole clip (~3-4s),
    // so the voice lands with the step animation instead of lagging far behind it.
    controllerRef.current = speakTextStream(buildGuideText(problem), {
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
    if (autoPlay) play();
    return clearPlayback;
  }, [autoPlay, clearPlayback, play]);

  const startPlay = () => {
    setStarted(true);
    play();
  };

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
        <Btn size="sm" variant={started ? "ghost" : "primary"} onClick={startPlay}>
          {started ? "再看一遍 🔁" : "▶ 播放"}
        </Btn>
      </div>
    </div>
  );
}
