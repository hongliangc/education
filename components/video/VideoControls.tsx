"use client";

import type { OpenListVariant } from "@/lib/openlist/client-core";
import { formatTimecode } from "@/lib/video/player-ui";
import { QualityMenu } from "@/components/video/QualityMenu";
import { VideoScrubber } from "@/components/video/VideoScrubber";
import { cn } from "@/lib/utils";

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  playing: boolean;
  muted: boolean;
  volume: number;
  isFullscreen: boolean;
  variants: OpenListVariant[];
  activeQuality: string | undefined;
  onSeek: (timeSec: number) => void;
  onSeekBy: (deltaSec: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolume: (value: number) => void;
  onSelectQuality: (quality: string) => void;
  onToggleFullscreen: () => void;
}

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-lg font-black text-white ring-1 ring-white/20 backdrop-blur transition hover:bg-white/20";

export function VideoControls({
  currentTime,
  duration,
  bufferedEnd,
  playing,
  muted,
  volume,
  isFullscreen,
  variants,
  activeQuality,
  onSeek,
  onSeekBy,
  onTogglePlay,
  onToggleMute,
  onVolume,
  onSelectQuality,
  onToggleFullscreen,
}: VideoControlsProps) {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-3xl bg-black/30 p-3 ring-1 ring-white/10 backdrop-blur-xl sm:p-4">
      <VideoScrubber
        currentTime={currentTime}
        duration={duration}
        bufferedEnd={bufferedEnd}
        onSeek={onSeek}
      />

      <div className="mt-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "暂停" : "播放"}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-slate-900 shadow-lg transition hover:scale-105"
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => onSeekBy(-10)}
            aria-label="后退十秒"
            className={cn(iconButton, "text-sm")}
          >
            ↺10
          </button>
          <button
            type="button"
            onClick={() => onSeekBy(10)}
            aria-label="前进十秒"
            className={cn(iconButton, "text-sm")}
          >
            10↻
          </button>
          <span className="ml-1 select-none text-sm font-bold tabular-nums text-white/80">
            {formatTimecode(currentTime)}
            <span className="text-white/40"> / {formatTimecode(duration)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muted ? "打开声音" : "静音"}
              className={iconButton}
            >
              {muted || volume === 0 ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(event) => onVolume(Number(event.target.value))}
              aria-label="音量"
              className="hidden h-1 w-20 cursor-pointer appearance-none rounded-full bg-white/25 accent-white sm:block"
            />
          </div>
          <QualityMenu
            variants={variants}
            activeQuality={activeQuality}
            onSelect={onSelectQuality}
          />
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
            className={iconButton}
          >
            {isFullscreen ? "⛶" : "⛶"}
          </button>
        </div>
      </div>
    </div>
  );
}
