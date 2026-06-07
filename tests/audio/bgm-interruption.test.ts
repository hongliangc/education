import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { interruptAudio } from "../../components/audio/bgmControl.ts";

test("pauses playing audio and restores it once", async () => {
  let paused = false;
  let playCalls = 0;
  const audio = {
    get paused() {
      return paused;
    },
    pause() {
      paused = true;
    },
    async play() {
      playCalls++;
      paused = false;
    },
  };

  const restore = interruptAudio(audio);
  assert.equal(paused, true);

  restore();
  restore();
  await Promise.resolve();

  assert.equal(paused, false);
  assert.equal(playCalls, 1);
});

test("does not start audio that was already paused", async () => {
  let playCalls = 0;
  const audio = {
    paused: true,
    pause() {},
    async play() {
      playCalls++;
    },
  };

  const restore = interruptAudio(audio);
  restore();
  await Promise.resolve();

  assert.equal(playCalls, 0);
});
