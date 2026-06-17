import type { OpenListVariant } from "@/lib/openlist/client-core";

const QUALITY_LABELS: Record<string, string> = {
  QHD: "2K",
  FHD: "1080p",
  HD: "720p",
  SD: "480p",
  LD: "360p",
};

/** Map an Alipan transcode template id to a viewer-facing resolution label. */
export function qualityLabel(quality: string | undefined): string {
  if (!quality) return "自动";
  return QUALITY_LABELS[quality.toUpperCase()] ?? quality;
}

/** Format a playback position as `M:SS`, or `H:MM:SS` once it crosses an hour. */
export function formatTimecode(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

/** Clamp a 0..1 progress ratio, treating NaN as 0. */
export function clampRatio(ratio: number): number {
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

/** Convert a 0..1 ratio to an absolute time within a duration. */
export function ratioToTime(ratio: number, durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return clampRatio(ratio) * durationSec;
}

/** Convert an absolute time to a 0..1 ratio within a duration. */
export function timeToRatio(timeSec: number, durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0;
  return clampRatio(timeSec / durationSec);
}

/**
 * Pick the quality to start with: honour the remembered choice when it is still
 * offered, otherwise fall back to the highest available rendition.
 */
export function pickInitialQuality(
  variants: OpenListVariant[],
  remembered: string | null | undefined,
): string | undefined {
  if (remembered && variants.some((variant) => variant.quality === remembered)) {
    return remembered;
  }
  return variants[0]?.quality;
}
