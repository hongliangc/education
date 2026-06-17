"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface VideoHotkeyActions {
  togglePlay: () => void;
  seekBy: (deltaSec: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  showControls: () => void;
  onEscape: () => void;
}

const SEEK_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

/**
 * Global player shortcuts: Space/K play-pause, ←/→ ±10s, ↑/↓ volume, M mute,
 * F fullscreen, Esc back. Skips arrow keys while a form field or the scrubber
 * slider is focused so their own handling wins.
 */
export function useVideoHotkeys(
  videoRef: RefObject<HTMLVideoElement | null>,
  actions: VideoHotkeyActions,
): void {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const isField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const isSlider = target?.getAttribute?.("role") === "slider";
      if ((isField || isSlider) && SEEK_KEYS.includes(event.key)) return;
      // Let a focused button handle its own activation instead of double-firing.
      if (tag === "BUTTON" && (event.key === " " || event.key === "Enter")) return;

      const actions = actionsRef.current;
      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          actions.showControls();
          actions.togglePlay();
          break;
        case "ArrowLeft":
          event.preventDefault();
          actions.showControls();
          actions.seekBy(-10);
          break;
        case "ArrowRight":
          event.preventDefault();
          actions.showControls();
          actions.seekBy(10);
          break;
        case "ArrowUp":
          event.preventDefault();
          actions.showControls();
          actions.setVolume(video.volume + 0.1);
          break;
        case "ArrowDown":
          event.preventDefault();
          actions.showControls();
          actions.setVolume(video.volume - 0.1);
          break;
        case "m":
        case "M":
          actions.showControls();
          actions.toggleMute();
          break;
        case "f":
        case "F":
          actions.toggleFullscreen();
          break;
        case "Escape":
          if (!document.fullscreenElement) actions.onEscape();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videoRef]);
}
