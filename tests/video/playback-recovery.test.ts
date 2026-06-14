import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { clampResumeTime, playRetryDelayMs } from "../../lib/video/playback.ts";

test("uses the larger of server retry advice and exponential backoff", () => {
  assert.equal(playRetryDelayMs(0, 5), 5_000);
  assert.equal(playRetryDelayMs(3, 1), 8_000);
  assert.equal(playRetryDelayMs(10, 1), 30_000);
});

test("clamps resume time to the playable duration", () => {
  assert.equal(clampResumeTime(42, 100), 42);
  assert.equal(clampResumeTime(120, 100), 99.5);
  assert.equal(clampResumeTime(-5, 100), 0);
  assert.equal(clampResumeTime(20, Number.NaN), 20);
});
