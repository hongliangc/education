"use client";

import type { OpenListVariant } from "@/lib/openlist/client-core";
import { formatTimecode } from "@/lib/video/player-ui";
import { QualityMenu } from "@/components/video/QualityMenu";
import { SpeedMenu } from "@/components/video/SpeedMenu";
import { EpisodeMenu, type EpisodeItem } from "@/components/video/EpisodeMenu";
import { VideoScrubber } from "@/components/video/VideoScrubber";
import {
  PlayIcon,
  PauseIcon,
  NextIcon,
  Replay10Icon,
  Forward10Icon,
  VolumeHighIcon,
  VolumeMuteIcon,
  LockIcon,
  FullscreenIcon,
  FullscreenExitIcon,
} from "@/components/video/icons";
import { cn } from "@/lib/utils";

interface VideoControlsProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  playing: boolean;
  muted: boolean;
  volume: number;
  isFullscreen: boolean;
  rate: number;
  variants: OpenListVariant[];
  activeQuality: string | undefined;
  hasNext?: boolean;
  episodes?: EpisodeItem[];
  currentEpisodeId?: string;
  onSeek: (timeSec: number) => void;
  onSeekBy: (deltaSec: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolume: (value: number) => void;
  onRate: (rate: number) => void;
  onSelectQuality: (quality: string) => void;
  onToggleFullscreen: () => void;
  onLock: () => void;
  onNext?: () => void;
  onSelectEpisode?: (id: string) => void;
}

// 扁平图标按钮（腾讯网页播放器风格）：默认无底，hover 才浮起高亮。
const iconBtn =
  "flex items-center justify-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white";
const btnSize = "h-9 w-9 sm:h-10 sm:w-10";
const iconSize = "h-5 w-5 sm:h-6 sm:w-6";

export function VideoControls({
  currentTime,
  duration,
  bufferedEnd,
  playing,
  muted,
  volume,
  isFullscreen,
  rate,
  variants,
  activeQuality,
  hasNext,
  episodes,
  currentEpisodeId,
  onSeek,
  onSeekBy,
  onTogglePlay,
  onToggleMute,
  onVolume,
  onRate,
  onSelectQuality,
  onToggleFullscreen,
  onLock,
  onNext,
  onSelectEpisode,
}: VideoControlsProps) {
  const muteOn = muted || volume === 0;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <VideoScrubber
        currentTime={currentTime}
        duration={duration}
        bufferedEnd={bufferedEnd}
        onSeek={onSeek}
      />

      <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-1 gap-y-2 sm:gap-x-2">
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={playing ? "暂停" : "播放"}
            className={cn(iconBtn, "h-10 w-10 sm:h-11 sm:w-11")}
          >
            {playing ? (
              <PauseIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            ) : (
              <PlayIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            )}
          </button>
          {hasNext && onNext && (
            <button type="button" onClick={onNext} aria-label="下一集" className={cn(iconBtn, btnSize)}>
              <NextIcon className={iconSize} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onSeekBy(-10)}
            aria-label="后退十秒"
            className={cn(iconBtn, btnSize)}
          >
            <Replay10Icon className={iconSize} />
          </button>
          <button
            type="button"
            onClick={() => onSeekBy(10)}
            aria-label="前进十秒"
            className={cn(iconBtn, btnSize)}
          >
            <Forward10Icon className={iconSize} />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={muteOn ? "打开声音" : "静音"}
              className={cn(iconBtn, btnSize)}
            >
              {muteOn ? <VolumeMuteIcon className={iconSize} /> : <VolumeHighIcon className={iconSize} />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muteOn ? 0 : volume}
              onChange={(event) => onVolume(Number(event.target.value))}
              aria-label="音量"
              className="hidden h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/25 accent-white sm:block"
            />
          </div>
          <span className="ml-1.5 select-none text-xs font-medium tabular-nums text-white/85 sm:text-sm">
            {formatTimecode(currentTime)}
            <span className="text-white/45"> / {formatTimecode(duration)}</span>
          </span>
        </div>

        <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
          <SpeedMenu rate={rate} onSelect={onRate} />
          <QualityMenu
            variants={variants}
            activeQuality={activeQuality}
            onSelect={onSelectQuality}
          />
          {episodes && currentEpisodeId && onSelectEpisode && (
            <EpisodeMenu
              episodes={episodes}
              currentId={currentEpisodeId}
              onSelect={onSelectEpisode}
            />
          )}
          <button type="button" onClick={onLock} aria-label="锁屏" className={cn(iconBtn, btnSize)}>
            <LockIcon className={iconSize} />
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
            className={cn(iconBtn, btnSize)}
          >
            {isFullscreen ? (
              <FullscreenExitIcon className={iconSize} />
            ) : (
              <FullscreenIcon className={iconSize} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
