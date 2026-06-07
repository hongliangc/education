import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { createHoldToTalkSession } from "../../components/fairy/holdToTalk.ts";

test("stops the same recording when release happens before microphone startup finishes", async () => {
  let finishStart: (() => void) | undefined;
  let stopCalls = 0;
  const audio = new Blob(["voice"], { type: "audio/wav" });
  const recorder = {
    start: () =>
      new Promise<void>((resolve) => {
        finishStart = resolve;
      }),
    async stop() {
      stopCalls++;
      return audio;
    },
    cancel() {},
  };
  const session = createHoldToTalkSession(() => recorder);

  const started = session.begin();
  const stopped = session.end();
  finishStart?.();

  assert.equal(await started, false);
  assert.equal(await stopped, audio);
  assert.equal(stopCalls, 1);
});
