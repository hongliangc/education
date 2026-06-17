const QUALITY_STORAGE_KEY = "mlk.video.quality";

/** Best-effort read of the viewer's last chosen quality (null if unavailable). */
export function readRememberedQuality(): string | null {
  try {
    return window.localStorage.getItem(QUALITY_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Best-effort persist of the chosen quality; private mode / disabled storage is ignored. */
export function rememberQuality(quality: string): void {
  try {
    window.localStorage.setItem(QUALITY_STORAGE_KEY, quality);
  } catch {
    // ignore
  }
}
