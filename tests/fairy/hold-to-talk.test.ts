import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { createHoldToTalkSession } from "../../components/fairy/holdToTalk.ts";

test("discards a recording released before microphone startup finishes (iOS first-permission gesture)", async () => {
  // iOS 首次点麦克风会弹权限框，start()(getUserMedia) 一直挂起；用户为点「允许」松手时录音还没开始，
  // 此刻零采集。这一下只为授权，不应产出可识别录音（否则录到空白→STT 空→误答「没听清」）。
  // 见 bugfix:2026-06-22-fairy-mic-permission-empty-recording。
  let finishStart: (() => void) | undefined;
  let stopCalls = 0;
  let cancelCalls = 0;
  const recorder = {
    start: () =>
      new Promise<void>((resolve) => {
        finishStart = resolve;
      }),
    async stop() {
      stopCalls++;
      return new Blob(["voice"], { type: "audio/wav" });
    },
    cancel() {
      cancelCalls++;
    },
  };
  const session = createHoldToTalkSession(() => recorder, { wait: async () => {} });

  const started = session.begin();
  const stopped = session.end(); // 松手时 start 还没 resolve（权限框还开着）
  finishStart?.(); // 之后点「允许」，授权完成

  assert.equal(await started, false);
  assert.equal(await stopped, null); // 不产出录音
  assert.equal(stopCalls, 0); // 不调用 stop
  // 授权完成后取消录音、释放麦克风轨道
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(cancelCalls, 1);
});

test("keeps recording for 200ms after release before stopping", async () => {
  let finishDelay: (() => void) | undefined;
  let delayedMs: number | undefined;
  let stopCalls = 0;
  const audio = new Blob(["complete voice"], { type: "audio/wav" });
  const recorder = {
    async start() {},
    async stop() {
      stopCalls++;
      return audio;
    },
    cancel() {},
  };
  const session = createHoldToTalkSession(() => recorder, {
    wait: (ms) =>
      new Promise<void>((resolve) => {
        delayedMs = ms;
        finishDelay = resolve;
      }),
  });

  assert.equal(await session.begin(), true);
  const stopped = session.end();
  await Promise.resolve();

  assert.equal(delayedMs, 200);
  assert.equal(stopCalls, 0);

  finishDelay?.();
  assert.equal(await stopped, audio);
  assert.equal(stopCalls, 1);
});

test("ignores a duplicate release so one gesture submits the recording once", async () => {
  let stopCalls = 0;
  const audio = new Blob(["voice"], { type: "audio/wav" });
  const recorder = {
    async start() {},
    async stop() {
      stopCalls++;
      return audio;
    },
    cancel() {},
  };
  const session = createHoldToTalkSession(() => recorder, { wait: async () => {} });

  assert.equal(await session.begin(), true);
  // 触屏松手同步派发 pointerup + pointerleave → end() 被同步调用两次。
  const first = session.end();
  const second = session.end();

  assert.equal(await first, audio);
  assert.equal(await second, null); // 第二次调用必须落空，否则会重复作答
  assert.equal(stopCalls, 1);
});

test("does not stop or submit a recording cancelled during the release delay", async () => {
  let finishDelay: (() => void) | undefined;
  let stopCalls = 0;
  let cancelCalls = 0;
  const recorder = {
    async start() {},
    async stop() {
      stopCalls++;
      return new Blob(["voice"], { type: "audio/wav" });
    },
    cancel() {
      cancelCalls++;
    },
  };
  const session = createHoldToTalkSession(() => recorder, {
    wait: () =>
      new Promise<void>((resolve) => {
        finishDelay = resolve;
      }),
  });

  assert.equal(await session.begin(), true);
  const stopped = session.end();
  await Promise.resolve();
  session.cancel();
  finishDelay?.();

  assert.equal(await stopped, null);
  assert.equal(stopCalls, 0);
  assert.equal(cancelCalls, 1);
});
