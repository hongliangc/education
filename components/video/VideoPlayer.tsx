"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { cn } from "@/lib/utils";
import type { OpenListVariant } from "@/lib/openlist/client-core";
import { clampRatio, pickInitialQuality } from "@/lib/video/player-ui";
import { VideoControls } from "@/components/video/VideoControls";
import { useHlsVideo } from "@/components/video/useHlsVideo";
import { useVideoHotkeys } from "@/components/video/useVideoHotkeys";
import { useVideoMediaState } from "@/components/video/useVideoMediaState";
import { useLandscapeFullscreen } from "@/components/video/useLandscapeFullscreen";
import type { EpisodeItem } from "@/components/video/EpisodeMenu";
import { BackIcon, LockIcon } from "@/components/video/icons";
import { readRememberedQuality, rememberQuality } from "@/lib/video/quality-storage";

interface VideoPlayerProps {
  title: string;
  posterUrl?: string;
  src?: string;
  variants?: OpenListVariant[];
  loading?: boolean;
  error?: string;
  resumeAtSec?: number;
  episodes?: EpisodeItem[];
  currentEpisodeId?: string;
  onRefreshSource?: (resumeAtSec: number) => void;
  onBack: () => void;
  onNext?: () => void;
  onSelectEpisode?: (id: string) => void;
}

const EMPTY_VARIANTS: OpenListVariant[] = [];

export function VideoPlayer({
  title,
  posterUrl,
  src,
  variants,
  loading = false,
  error,
  resumeAtSec = 0,
  episodes,
  currentEpisodeId,
  onRefreshSource,
  onBack,
  onNext,
  onSelectEpisode,
}: VideoPlayerProps) {
  const variantList = variants && variants.length > 0 ? variants : EMPTY_VARIANTS;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingResumeRef = useRef(0);
  const resumePlayingRef = useRef(false);
  const resumeAtSecRef = useRef(resumeAtSec);
  resumeAtSecRef.current = resumeAtSec;
  const onRefreshRef = useRef(onRefreshSource);
  onRefreshRef.current = onRefreshSource;
  const hideTimerRef = useRef<number | null>(null);

  const [activeQuality, setActiveQuality] = useState<string | undefined>(undefined);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [locked, setLocked] = useState(false);
  const [rate, setRate] = useState(1);
  const { isFullscreen, toggle: toggleFullscreen } = useLandscapeFullscreen(containerRef, videoRef);

  const { playing, muted, volume, currentTime, duration, bufferedEnd } = useVideoMediaState(
    videoRef,
    pendingResumeRef,
    resumePlayingRef,
    resumeAtSecRef,
  );

  // With variants, wait for the rendition to resolve before loading (avoids a
  // default-then-remembered double fetch); otherwise fall back to the plain src.
  const activeSrc =
    variantList.length > 0 ? variantList.find((v) => v.quality === activeQuality)?.url : src;

  // Pick the rendition whenever the variant set changes (new video / refreshed url).
  useEffect(() => {
    if (variantList.length === 0) return;
    setActiveQuality((current) => {
      if (current && variantList.some((v) => v.quality === current)) return current;
      return pickInitialQuality(variantList, readRememberedQuality());
    });
  }, [variantList]);

  useHlsVideo(videoRef, activeSrc, () => {
    onRefreshRef.current?.(videoRef.current?.currentTime ?? 0);
  });

  // 应用播放速度；切清晰度/换源会把 video.playbackRate 重置回 1，故依赖 activeSrc 重新施加。
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  }, [rate, activeSrc]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    },
    [],
  );

  const showControls = () => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setControlsVisible(false);
    }, 3000);
  };

  // Pause / load → keep controls up; playing → start the auto-hide countdown.
  useEffect(() => {
    if (playing) {
      showControls();
    } else {
      setControlsVisible(true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  };
  const seekBy = (deltaSec: number) => {
    const video = videoRef.current;
    if (!video) return;
    const max = Number.isFinite(video.duration) ? video.duration : video.currentTime + deltaSec;
    video.currentTime = Math.min(max, Math.max(0, video.currentTime + deltaSec));
  };
  const seekTo = (timeSec: number) => {
    const video = videoRef.current;
    if (video) video.currentTime = Math.max(0, timeSec);
  };
  const setVolumeValue = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = clampRatio(value);
    video.volume = next;
    if (next > 0 && video.muted) video.muted = false;
  };
  const toggleMute = () => {
    const video = videoRef.current;
    if (video) video.muted = !video.muted;
  };
  const selectQuality = (quality: string) => {
    const video = videoRef.current;
    pendingResumeRef.current = video?.currentTime ?? 0;
    resumePlayingRef.current = video ? !video.paused : false;
    rememberQuality(quality);
    setActiveQuality(quality);
    showControls();
  };

  useVideoHotkeys(videoRef, {
    togglePlay,
    seekBy,
    setVolume: setVolumeValue,
    toggleMute,
    toggleFullscreen,
    showControls,
    onEscape: onBack,
  });

  const showOverlay = loading || Boolean(error) || !activeSrc;

  return (
    <section
      ref={containerRef}
      className={cn(
        "fixed inset-0 z-50 select-none bg-black text-white",
        !controlsVisible && playing && "cursor-none",
      )}
      onPointerMove={showControls}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        poster={posterUrl}
        playsInline
        controls={false}
        onClick={locked ? undefined : togglePlay}
      />

      {!locked && (
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 py-4 transition-all duration-300 sm:px-6",
          controlsVisible ? "opacity-100" : "-translate-y-2 opacity-0",
        )}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回片库"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white/90 transition hover:bg-white/15 hover:text-white"
          >
            <BackIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold drop-shadow sm:text-2xl">
            {title}
          </h1>
        </div>
      </div>
      )}

      {!showOverlay && !locked && (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent px-3 pb-4 pt-24 transition-all duration-300 sm:px-6",
            controlsVisible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
          )}
        >
          <VideoControls
            currentTime={currentTime}
            duration={duration}
            bufferedEnd={bufferedEnd}
            playing={playing}
            muted={muted}
            volume={volume}
            isFullscreen={isFullscreen}
            rate={rate}
            variants={variantList}
            activeQuality={activeQuality}
            hasNext={Boolean(onNext)}
            episodes={episodes}
            currentEpisodeId={currentEpisodeId}
            onSeek={seekTo}
            onSeekBy={seekBy}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onVolume={setVolumeValue}
            onRate={setRate}
            onSelectQuality={selectQuality}
            onToggleFullscreen={toggleFullscreen}
            onLock={() => setLocked(true)}
            onNext={onNext}
            onSelectEpisode={onSelectEpisode}
          />
        </div>
      )}

      {locked && (
        <button
          type="button"
          onClick={() => setLocked(false)}
          aria-label="解锁屏幕"
          className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-black/60"
        >
          <LockIcon className="h-5 w-5" />
        </button>
      )}

      {showOverlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="max-w-sm rounded-3xl bg-slate-900/80 p-6 text-center text-white shadow-2xl ring-1 ring-white/10">
            <div className="mb-3 text-5xl">{error ? "☁️" : "🎬"}</div>
            <p className="mb-4 text-lg font-bold">
              {error ?? (loading ? "视频正在准备..." : "选一个视频开始播放")}
            </p>
            {error && (
              <Btn variant="secondary" onClick={onBack}>
                返回片库
              </Btn>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
