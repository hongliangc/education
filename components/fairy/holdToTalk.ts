export interface HoldToTalkRecorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
}
interface ActiveRecording {
  recorder: HoldToTalkRecorder;
  startPromise: Promise<void>;
  released: boolean;
  cancelled: boolean;
  stopPromise: Promise<Blob | null> | null;
}

interface HoldToTalkOptions {
  stopDelayMs?: number;
  wait?: (ms: number) => Promise<void>;
}

export function createHoldToTalkSession(
  createRecorder: () => HoldToTalkRecorder,
  options: HoldToTalkOptions = {},
): {
  begin: () => Promise<boolean>;
  end: () => Promise<Blob | null>;
  cancel: () => void;
} {
  let active: ActiveRecording | null = null;
  const stopDelayMs = options.stopDelayMs ?? 200;
  const wait =
    options.wait ??
    ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  return {
    async begin() {
      if (active) return false;

      const recorder = createRecorder();
      const recording: ActiveRecording = {
        recorder,
        startPromise: recorder.start(),
        released: false,
        cancelled: false,
        stopPromise: null,
      };
      active = recording;

      try {
        await recording.startPromise;
        return active === recording && !recording.released;
      } catch (error) {
        if (active === recording) active = null;
        recorder.cancel();
        throw error;
      }
    },

    async end() {
      const recording = active;
      if (!recording) return null;
      // 同一次录音只接受一次 end。触屏松手会同步派发 pointerup + pointerleave，
      // 两个 handler 都会调 end()；重复调用返回 null，避免同一份录音被识别/作答两次
      // （见 bugfix:2026-06-10-fairy-voice-double-answer）。
      if (recording.released) return null;

      recording.released = true;
      recording.stopPromise = (async () => {
        try {
          await Promise.all([recording.startPromise, wait(stopDelayMs)]);
          if (recording.cancelled) return null;
          return await recording.recorder.stop();
        } finally {
          if (active === recording) active = null;
        }
      })();

      return recording.stopPromise;
    },

    cancel() {
      const recording = active;
      active = null;
      if (recording) {
        recording.cancelled = true;
        recording.recorder.cancel();
      }
    },
  };
}
