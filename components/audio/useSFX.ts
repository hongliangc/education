"use client";

import { useEffect, useRef } from "react";

type SFX = {
  correct: () => void;
  wrong: () => void;
  fanfare: () => void;
  coin: () => void;
  pop: () => void;
  whoosh: () => void;
  click: () => void;
  pageFlip: () => void;
  word: () => void;
  unlock: () => void;
  heart: () => void;
};

// 单例 AudioContext，避免每次 hook 重建（浏览器限制每页 6 个）
let _ac: AudioContext | null = null;
function getAC(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ac) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    _ac = new Ctor();
  }
  return _ac;
}

export function useSFX(): { sfx: SFX; unlock: () => void } {
  const unlockedRef = useRef(false);

  // 用户首次交互后唤醒（iOS Safari 限制）
  useEffect(() => {
    const wake = () => {
      const ac = getAC();
      if (ac && ac.state === "suspended") ac.resume();
      unlockedRef.current = true;
    };
    window.addEventListener("pointerdown", wake, { once: true });
    window.addEventListener("keydown", wake, { once: true });
    return () => {
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("keydown", wake);
    };
  }, []);

  const tone = (
    freq: number,
    dur: number,
    type: OscillatorType = "sine",
    vol = 0.18,
    delay = 0,
  ) => {
    const ac = getAC();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + delay;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.start(t);
    osc.stop(t + dur);
  };

  const sfx: SFX = {
    correct: () =>
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "sine", 0.22, i * 0.08)),
    wrong: () => {
      tone(200, 0.15, "sawtooth", 0.16);
      setTimeout(() => tone(160, 0.2, "sawtooth", 0.13), 100);
    },
    fanfare: () =>
      [523, 659, 784, 659, 784, 1047, 1318].forEach((f, i) =>
        tone(f, 0.22, "sine", 0.2, i * 0.1),
      ),
    coin: () => {
      tone(1568, 0.06, "sine", 0.18);
      setTimeout(() => tone(2093, 0.09, "sine", 0.16), 80);
    },
    pop: () => {
      tone(880, 0.08, "sine", 0.16);
      setTimeout(() => tone(1200, 0.06, "sine", 0.1), 60);
    },
    whoosh: () => [800, 500, 300].forEach((f, i) => tone(f, 0.12, "sine", 0.1, i * 0.07)),
    click: () => tone(600, 0.09, "sine", 0.12),
    pageFlip: () =>
      [700, 600, 500].forEach((f, i) => tone(f, 0.09, "triangle", 0.1, i * 0.05)),
    word: () => tone(900, 0.06, "sine", 0.07),
    unlock: () =>
      [392, 523, 659, 784].forEach((f, i) =>
        tone(f, 0.16, "triangle", 0.18, i * 0.07),
      ),
    heart: () => tone(440, 0.18, "sine", 0.16),
  };

  return {
    sfx,
    unlock: () => {
      const ac = getAC();
      if (ac && ac.state === "suspended") ac.resume();
    },
  };
}
