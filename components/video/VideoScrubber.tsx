"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import {
  clampRatio,
  formatTimecode,
  ratioToTime,
  timeToRatio,
} from "@/lib/video/player-ui";

interface VideoScrubberProps {
  currentTime: number;
  duration: number;
  bufferedEnd: number;
  onSeek: (timeSec: number) => void;
}

export function VideoScrubber({
  currentTime,
  duration,
  bufferedEnd,
  onSeek,
}: VideoScrubberProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);

  const playRatio = dragRatio ?? timeToRatio(currentTime, duration);
  const bufferedRatio = timeToRatio(bufferedEnd, duration);
  const bubbleRatio = dragRatio ?? hoverRatio;

  const ratioFromPointer = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return 0;
    return clampRatio((clientX - rect.left) / rect.width);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragRatio(ratioFromPointer(event.clientX));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const ratio = ratioFromPointer(event.clientX);
    if (draggingRef.current) {
      setDragRatio(ratio);
    } else {
      setHoverRatio(ratio);
    }
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onSeek(ratioToTime(dragRatio ?? 0, duration));
    setDragRatio(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = Math.min(duration, currentTime + 5);
    else if (event.key === "ArrowLeft") next = Math.max(0, currentTime - 5);
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = duration;
    if (next === null) return;
    event.preventDefault();
    event.stopPropagation();
    onSeek(next);
  };

  return (
    <div className="group/scrubber relative flex items-center py-2">
      {bubbleRatio !== null && duration > 0 && (
        <div
          className="pointer-events-none absolute -top-9 z-10 -translate-x-1/2 rounded-lg bg-slate-900/85 px-2 py-1 text-xs font-bold text-white ring-1 ring-white/15 backdrop-blur"
          style={{ left: `clamp(1.5rem, ${bubbleRatio * 100}%, calc(100% - 1.5rem))` }}
        >
          {/* Thumbnail preview layer reserved here for a future storyboard source. */}
          {formatTimecode(ratioToTime(bubbleRatio, duration))}
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="播放进度"
        aria-valuemin={0}
        aria-valuemax={Math.max(0, Math.floor(duration))}
        aria-valuenow={Math.floor(dragRatio !== null ? ratioToTime(dragRatio, duration) : currentTime)}
        aria-valuetext={formatTimecode(
          dragRatio !== null ? ratioToTime(dragRatio, duration) : currentTime,
        )}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={() => {
          if (!draggingRef.current) setHoverRatio(null);
        }}
        onKeyDown={handleKeyDown}
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/15 transition-[height] group-hover/scrubber:h-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/25"
          style={{ width: `${bufferedRatio * 100}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: `${playRatio * 100}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-[0_0_0_4px_rgba(255,255,255,0.18)] transition group-hover/scrubber:opacity-100"
          style={{ left: `${playRatio * 100}%`, opacity: dragRatio !== null ? 1 : undefined }}
        />
      </div>
    </div>
  );
}
