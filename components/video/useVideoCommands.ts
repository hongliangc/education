"use client";

import { useCallback, type RefObject } from "react";
import { clampRatio } from "@/lib/video/player-ui";

/**
 * 命令式媒体操作，统一收口对 <video> 的直接控制：播放/暂停、相对快进退、跳转、音量、静音。
 * 全部读 videoRef.current 即时操作，无内部状态。
 */
export function useVideoCommands(
  videoRef: RefObject<HTMLVideoElement | null>,
  activeSrc: string | undefined,
) {
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, [videoRef, activeSrc]);

  const seekBy = useCallback(
    (deltaSec: number) => {
      const video = videoRef.current;
      if (!video) return;
      const max = Number.isFinite(video.duration) ? video.duration : video.currentTime + deltaSec;
      video.currentTime = Math.min(max, Math.max(0, video.currentTime + deltaSec));
    },
    [videoRef],
  );

  const seekTo = useCallback(
    (timeSec: number) => {
      const video = videoRef.current;
      if (video) video.currentTime = Math.max(0, timeSec);
    },
    [videoRef],
  );

  const setVolume = useCallback(
    (value: number) => {
      const video = videoRef.current;
      if (!video) return;
      const next = clampRatio(value);
      video.volume = next;
      if (next > 0 && video.muted) video.muted = false;
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  }, [videoRef]);

  return { togglePlay, seekBy, seekTo, setVolume, toggleMute };
}
