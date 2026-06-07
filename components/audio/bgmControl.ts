export interface InterruptibleAudio {
  readonly paused: boolean;
  pause: () => void;
  play: () => Promise<void>;
}

export function interruptAudio(audio: InterruptibleAudio | null): () => void {
  if (!audio) return () => undefined;

  const shouldResume = !audio.paused;
  let restored = false;
  audio.pause();

  return () => {
    if (restored) return;
    restored = true;
    if (shouldResume) void audio.play().catch(() => {});
  };
}
