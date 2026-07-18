"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { OpenListVariant } from "@/lib/openlist/client-core";
import { VideoControls } from "@/components/video/VideoControls";
import { VideoStatusOverlay } from "@/components/video/VideoStatusOverlay";
import { VideoLockButton } from "@/components/video/VideoLockButton";
import { useHlsVideo } from "@/components/video/useHlsVideo";
import { useVideoHotkeys } from "@/components/video/useVideoHotkeys";
import { useVideoMediaState } from "@/components/video/useVideoMediaState";
import { useVideoSource } from "@/components/video/useVideoSource";
import { useVideoCommands } from "@/components/video/useVideoCommands";
import { useControlsVisibility } from "@/components/video/useControlsVisibility";
import { useLandscapeFullscreen } from "@/components/video/useLandscapeFullscreen";
import type { EpisodeItem } from "@/components/video/EpisodeMenu";
import { BackIcon, PlayIcon } from "@/components/video/icons";
import { rememberQuality } from "@/lib/video/quality-storage";

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
  onRememberPosition?: (currentTimeSec: number, durationSec: number) => void;
  onBack: (currentTimeSec?: number, durationSec?: number) => void;
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
  onRememberPosition,
  onBack,
  onNext,
  onSelectEpisode,
}: VideoPlayerProps) {
  const variantList = variants && variants.length > 0 ? variants : EMPTY_VARIANTS;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resumeAtSecRef = useRef(resumeAtSec);
  resumeAtSecRef.current = resumeAtSec;
  const onRefreshRef = useRef(onRefreshSource);
  onRefreshRef.current = onRefreshSource;

  const [locked, setLocked] = useState(false);
  const [rate, setRate] = useState(1);
  // 全屏时可放大裁切填满（object-cover），默认保留比例；退出全屏自动回到 contain。
  const [filled, setFilled] = useState(false);

  const { isFullscreen, toggle: toggleFullscreen } = useLandscapeFullscreen(containerRef, videoRef);
  const { activeQuality, setActiveQuality, activeSrc, pendingResumeRef, resumePlayingRef } =
    useVideoSource(variantList, src);
  const { playing, muted, volume, currentTime, duration, bufferedEnd } = useVideoMediaState(
    videoRef,
    pendingResumeRef,
    resumePlayingRef,
    resumeAtSecRef,
  );
  const { togglePlay, seekBy, seekTo, setVolume, toggleMute } = useVideoCommands(videoRef, activeSrc);
  const { controlsVisible, showControls, toggleControls } = useControlsVisibility(videoRef, playing);

  useHlsVideo(videoRef, activeSrc, () => {
    onRefreshRef.current?.(videoRef.current?.currentTime ?? 0);
  });

  const rememberCurrentPosition = () => {
    const video = videoRef.current;
    if (!video || !onRememberPosition) return;
    onRememberPosition(video.currentTime, Number.isFinite(video.duration) ? video.duration : 0);
  };

  const handleBack = () => {
    const video = videoRef.current;
    onBack(video?.currentTime ?? 0, video && Number.isFinite(video.duration) ? video.duration : 0);
  };

  const handleNext = () => {
    rememberCurrentPosition();
    onNext?.();
  };

  const handleSelectEpisode = (id: string) => {
    rememberCurrentPosition();
    onSelectEpisode?.(id);
  };

  useEffect(() => {
    if (!onRememberPosition || currentTime <= 0) return;
    onRememberPosition(currentTime, duration);
  }, [currentTime, duration, onRememberPosition]);

  useEffect(() => {
    if (!onRememberPosition) return;
    window.addEventListener("pagehide", rememberCurrentPosition);
    return () => window.removeEventListener("pagehide", rememberCurrentPosition);
  });

  // 应用播放速度。切清晰度/换源会把 playbackRate 重置回 1，故依赖 activeSrc 重新施加。
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = rate;
  }, [rate, activeSrc]);

  useEffect(() => {
    if (!isFullscreen) setFilled(false);
  }, [isFullscreen]);

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
    setVolume,
    toggleMute,
    toggleFullscreen,
    showControls,
    onEscape: handleBack,
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
    >
      <video
        ref={videoRef}
        className={cn(
          "h-full w-full bg-black",
          isFullscreen && filled ? "object-cover" : "object-contain",
        )}
        poster={posterUrl}
        playsInline
        controls={false}
      />

      {/* 点击画面切换控件显隐（参考腾讯）；覆盖在视频上、控件下。 */}
      {!showOverlay && !locked && (
        <button
          type="button"
          onClick={toggleControls}
          aria-label="切换控件"
          className="absolute inset-0 z-0 h-full w-full cursor-default"
        />
      )}

      {!showOverlay && !locked && !playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="播放"
          className="absolute left-1/2 top-1/2 z-10 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-black/60"
        >
          <PlayIcon className="h-8 w-8" />
        </button>
      )}

      {!locked && (
        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 via-black/30 to-transparent px-4 py-4 sm:px-6">
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
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
            filled={filled}
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
            onVolume={setVolume}
            onRate={setRate}
            onSelectQuality={selectQuality}
            onToggleFullscreen={toggleFullscreen}
            onToggleFill={() => setFilled((value) => !value)}
            onNext={handleNext}
            onSelectEpisode={handleSelectEpisode}
          />
        </div>
      )}

      <VideoLockButton
        visible={locked || (isFullscreen && controlsVisible)}
        locked={locked}
        onToggle={() => setLocked((value) => !value)}
      />

      {showOverlay && <VideoStatusOverlay loading={loading} error={error} onBack={handleBack} />}
    </section>
  );
}
