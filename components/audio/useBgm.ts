"use client";

import { useCallback, useEffect, useState } from "react";

const BGM_SRC = "/bgm/story-loop.mp3";
const LS_KEY = "mlk.bgm.enabled";
const VOLUME = 0.15;

let bgmAudio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!bgmAudio) {
    bgmAudio = new Audio(BGM_SRC);
    bgmAudio.loop = true;
    bgmAudio.volume = VOLUME;
    bgmAudio.preload = "auto";
  }
  return bgmAudio;
}

export function useBgm(): { enabled: boolean; toggle: () => void } {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const saved = window.localStorage.getItem(LS_KEY);
    if (saved !== null) setEnabled(saved === "1");
  }, []);

  useEffect(() => {
    const audio = getAudio();
    return () => {
      audio?.pause();
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LS_KEY, enabled ? "1" : "0");

    const audio = getAudio();
    if (!audio) return;

    if (enabled) void audio.play().catch(() => {});
    else audio.pause();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const kick = () => {
      void getAudio()?.play().catch(() => {});
    };

    window.addEventListener("pointerdown", kick, { once: true });
    return () => window.removeEventListener("pointerdown", kick);
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((current) => !current), []);

  return { enabled, toggle };
}
