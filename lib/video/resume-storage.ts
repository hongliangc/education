const RESUME_STORAGE_PREFIX = "mlk.video.resume.";
const MIN_RESUME_SEC = 5;
const FINISHED_REMAINING_SEC = 12;

interface ResumeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storageKey(videoId: string): string {
  return `${RESUME_STORAGE_PREFIX}${videoId}`;
}

function browserStorage(): ResumeStorage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function readResumePosition(videoId: string, storage = browserStorage()): number {
  if (!storage) return 0;
  try {
    const value = Number(storage.getItem(storageKey(videoId)));
    return Number.isFinite(value) && value >= MIN_RESUME_SEC ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

export function rememberResumePosition(
  videoId: string,
  currentTimeSec: number,
  storage = browserStorage(),
  durationSec = 0,
): void {
  if (!storage) return;
  try {
    const current = Math.floor(currentTimeSec);
    const duration = Number.isFinite(durationSec) ? durationSec : 0;
    const nearStart = current < MIN_RESUME_SEC;
    const nearEnd = duration > 0 && duration - current <= FINISHED_REMAINING_SEC;

    if (nearStart || nearEnd) {
      storage.removeItem(storageKey(videoId));
      return;
    }

    storage.setItem(storageKey(videoId), String(current));
  } catch {
    // Disabled or full storage should never break playback.
  }
}
