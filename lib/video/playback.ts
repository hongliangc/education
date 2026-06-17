export function playRetryDelayMs(attempt: number, suggestedSec?: number): number {
  const exponentialSec = Math.min(30, 2 ** Math.max(0, attempt));
  const serverSec =
    typeof suggestedSec === "number" && Number.isFinite(suggestedSec)
      ? Math.max(0, suggestedSec)
      : 0;
  return Math.max(exponentialSec, serverSec) * 1000;
}

export function clampResumeTime(requestedSec: number, durationSec: number): number {
  const requested = Number.isFinite(requestedSec) ? Math.max(0, requestedSec) : 0;
  if (!Number.isFinite(durationSec) || durationSec <= 0) return requested;
  return Math.min(requested, Math.max(0, durationSec - 0.5));
}
