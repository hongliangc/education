export interface HoldToTalkRecorder {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
}
interface ActiveRecording {
  recorder: HoldToTalkRecorder;
  startPromise: Promise<void>;
  started: boolean; // start()(含 getUserMedia)是否已 resolve——未 resolve 前没有任何音频被采集
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
        started: false,
        released: false,
        cancelled: false,
        stopPromise: null,
      };
      // start()(getUserMedia)真正完成才算「录音已开始」。iOS 首次授权时它会挂起到点「允许」之后。
      recording.startPromise.then(
        () => {
          recording.started = true;
        },
        () => {},
      );
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

      // 松手时录音还没真正开始（start 未 resolve）= iOS 首次授权手势（或极快误触）：弹权限框期间
      // 没有任何音频被采集，这一下只为拿权限，不应产出可识别录音（否则录到空白→STT 空→误答「没听清」）。
      // 直接丢弃：清空 active 让下次点击重新开始；待 start 完成后 cancel 释放麦克风轨道；返回 null。
      // 授权完成后再次点击时 start 立即 resolve（不再弹框），started 为真 → 走下面正常停录逻辑。
      if (!recording.started) {
        recording.cancelled = true;
        if (active === recording) active = null;
        void recording.startPromise.then(
          () => recording.recorder.cancel(),
          () => {},
        );
        return null;
      }

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
