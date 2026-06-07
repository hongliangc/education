export interface HoldToTalkRecorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
}
interface ActiveRecording {
  recorder: HoldToTalkRecorder;
  startPromise: Promise<void>;
  released: boolean;
  stopPromise: Promise<Blob> | null;
}

export function createHoldToTalkSession(
  createRecorder: () => HoldToTalkRecorder,
): {
  begin: () => Promise<boolean>;
  end: () => Promise<Blob | null>;
  cancel: () => void;
} {
  let active: ActiveRecording | null = null;

  return {
    async begin() {
      if (active) return false;

      const recorder = createRecorder();
      const recording: ActiveRecording = {
        recorder,
        startPromise: recorder.start(),
        released: false,
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

      recording.released = true;
      recording.stopPromise ??= (async () => {
        try {
          await recording.startPromise;
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
      recording?.recorder.cancel();
    },
  };
}
