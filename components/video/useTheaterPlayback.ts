"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";
import { playRetryDelayMs } from "@/lib/video/playback";
import { rememberLastPlayed } from "@/lib/video/recent-storage";
import type { OpenListVariant } from "@/lib/openlist/client-core";

interface PlayInfo {
  url: string;
  quality?: string;
  variants?: OpenListVariant[];
}

const MAX_SOURCE_REFRESHES = 2;

/**
 * Owns the theater's video-playback orchestration: requesting a (possibly still
 * transcoding) source with retry/backoff, source-refresh on a stale stream, and the
 * active-player state. Kept out of the page component so each stays a single concern.
 */
export function useTheaterPlayback(childId: string | undefined) {
  const [activeVideo, setActiveVideo] = useState<TheaterVideoItem | null>(null);
  const [playInfo, setPlayInfo] = useState<PlayInfo | null>(null);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [resumeAtSec, setResumeAtSec] = useState(0);
  const playAbortRef = useRef<AbortController | null>(null);
  const sourceRefreshCountRef = useRef(0);

  useEffect(
    () => () => {
      playAbortRef.current?.abort();
    },
    [],
  );

  const startPlayback = useCallback(
    async (video: TheaterVideoItem, resumeAt = 0, refreshSource = false) => {
      if (!childId) return;
      playAbortRef.current?.abort();
      const controller = new AbortController();
      playAbortRef.current = controller;
      if (!refreshSource) sourceRefreshCountRef.current = 0;
      rememberLastPlayed(video.id);
      setActiveVideo(video);
      setPlayInfo(null);
      setResumeAtSec(resumeAt);
      setPlayError(null);
      setPlayLoading(true);

      try {
        for (let attempt = 0; attempt < 6; attempt++) {
          const res = await fetch(
            `/api/videos/${encodeURIComponent(video.id)}/play?childId=${encodeURIComponent(childId)}${refreshSource ? "&refresh=1" : ""}`,
            { signal: controller.signal },
          );
          if (res.status === 403) throw new Error("locked");
          const json = (await res.json().catch(() => ({}))) as {
            play?: PlayInfo;
            error?: string;
            retryAfterSec?: number;
          };
          if (res.status === 202 && json.error === "video_preparing") {
            await new Promise<void>((resolve, reject) => {
              const timeout = window.setTimeout(resolve, playRetryDelayMs(attempt, json.retryAfterSec));
              controller.signal.addEventListener(
                "abort",
                () => {
                  window.clearTimeout(timeout);
                  reject(new DOMException("Aborted", "AbortError"));
                },
                { once: true },
              );
            });
            continue;
          }
          if (res.status === 422 || json.error === "video_transcode_failed") {
            throw new Error("transcode_failed");
          }
          if (!res.ok) throw new Error("play_failed");
          if (!json.play?.url) throw new Error("play_missing");
          setPlayInfo(json.play);
          return;
        }
        throw new Error("video_preparing");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPlayError(
          error instanceof Error && error.message === "locked"
            ? "先用小星星解锁吧。"
            : error instanceof Error && error.message === "transcode_failed"
              ? "这个视频转码失败了，换一个看看吧。"
              : error instanceof Error && error.message === "video_preparing"
                ? "视频还在准备中，稍后再试。"
                : "这个视频暂时打不开。",
        );
      } finally {
        if (playAbortRef.current === controller) {
          setPlayLoading(false);
        }
      }
    },
    [childId],
  );

  const refreshSource = useCallback(
    (currentTime: number) => {
      if (!activeVideo) return;
      if (sourceRefreshCountRef.current >= MAX_SOURCE_REFRESHES) {
        setPlayInfo(null);
        setPlayLoading(false);
        setPlayError("视频连接不稳定，稍后再试。");
        return;
      }
      sourceRefreshCountRef.current++;
      void startPlayback(activeVideo, currentTime, true);
    },
    [activeVideo, startPlayback],
  );

  const stopPlayback = useCallback(() => {
    playAbortRef.current?.abort();
    setActiveVideo(null);
    setPlayInfo(null);
    setPlayError(null);
    setPlayLoading(false);
    setResumeAtSec(0);
  }, []);

  return {
    activeVideo,
    playInfo,
    playLoading,
    playError,
    resumeAtSec,
    startPlayback,
    refreshSource,
    stopPlayback,
  };
}
