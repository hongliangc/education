"use client";

// 历史板块（上下五千年）背景歌曲。镜像 useBgm.ts 的单例 + 持久化 + 自动播放兜底，
// 但用独立的音源 / localStorage 键 / 音量，避免与故事阅读的 story-loop 冲突。
// 朝代歌带人声歌词，故进章节阅读（TTS 旁白）时由 ThreeKingdomsReader 调 interruptHistoryBgm() 暂停。
import { useCallback, useEffect, useState } from "react";
import { interruptAudio } from "./bgmControl";

const BGM_SRC = "/bgm/history-bgm.m4a";
const LS_KEY = "mlk.bgm.history.enabled";
const VOLUME = 1; // 朝代歌录得偏轻，拉满；阅读时已暂停、不与 TTS 抢

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

/** 进章节阅读时暂停朝代歌、返回退出时恢复的函数（镜像 interruptBgm）。 */
export function interruptHistoryBgm(): () => void {
  return interruptAudio(getAudio());
}

export function useHistoryBgm(): { enabled: boolean; toggle: () => void } {
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

  // 浏览器禁止无交互自动播放：首次指针/键盘交互后再尝试播放。
  useEffect(() => {
    if (!enabled) return;

    const kick = () => {
      void getAudio()?.play().catch(() => {});
    };

    window.addEventListener("pointerdown", kick, { once: true });
    window.addEventListener("keydown", kick, { once: true });
    return () => {
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
    };
  }, [enabled]);

  const toggle = useCallback(() => setEnabled((current) => !current), []);

  return { enabled, toggle };
}
