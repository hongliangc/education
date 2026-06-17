const LAST_PLAYED_STORAGE_KEY = "mlk.video.lastPlayed";

/** Best-effort read of the most recently played video id (null if unavailable). */
export function readLastPlayedId(): string | null {
  try {
    return window.localStorage.getItem(LAST_PLAYED_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Best-effort persist of the just-played video id; disabled storage is ignored. */
export function rememberLastPlayed(id: string): void {
  try {
    window.localStorage.setItem(LAST_PLAYED_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}
