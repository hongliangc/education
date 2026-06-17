"use client";

import { useEffect, useState, type RefObject } from "react";
import { clampResumeTime } from "@/lib/video/playback";

export interface VideoMediaState {
  playing: boolean;
  muted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  bufferedEnd: number;
}

/**
 * Mirror the <video> element's playback state into React and resume to the
 * pending position after each (re)load. `pendingResumeRef` covers quality
 * switches, `resumeAtSecRef` the parent-driven resume after a source refresh;
 * `resumePlayingRef` keeps a quality switch playing across the reload.
 */
export function useVideoMediaState(
  videoRef: RefObject<HTMLVideoElement | null>,
  pendingResumeRef: RefObject<number>,
  resumePlayingRef: RefObject<boolean>,
  resumeAtSecRef: RefObject<number>,
): VideoMediaState {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedEnd, setBufferedEnd] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
      const target = Math.max(pendingResumeRef.current, resumeAtSecRef.current ?? 0);
      if (target > 0) video.currentTime = clampResumeTime(target, video.duration);
      pendingResumeRef.current = 0;
      if (resumePlayingRef.current) {
        resumePlayingRef.current = false;
        void video.play().catch(() => undefined);
      }
    };
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () =>
      setDuration(Number.isFinite(video.duration) ? video.duration : 0);
    const onProgress = () => {
      const buffered = video.buffered;
      setBufferedEnd(buffered.length ? buffered.end(buffered.length - 1) : 0);
    };
    const onVolumeChange = () => {
      setMuted(video.muted);
      setVolume(video.volume);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("progress", onProgress);
    video.addEventListener("volumechange", onVolumeChange);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("progress", onProgress);
      video.removeEventListener("volumechange", onVolumeChange);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [videoRef, pendingResumeRef, resumePlayingRef, resumeAtSecRef]);

  return { playing, muted, volume, currentTime, duration, bufferedEnd };
}
