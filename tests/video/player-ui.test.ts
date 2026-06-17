import assert from "node:assert/strict";
import test from "node:test";

import {
  clampRatio,
  formatTimecode,
  pickInitialQuality,
  qualityLabel,
  ratioToTime,
  timeToRatio,
  // @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
} from "../../lib/video/player-ui.ts";

test("formatTimecode renders M:SS and grows to H:MM:SS past an hour", () => {
  assert.equal(formatTimecode(0), "0:00");
  assert.equal(formatTimecode(9), "0:09");
  assert.equal(formatTimecode(75), "1:15");
  assert.equal(formatTimecode(3661), "1:01:01");
  assert.equal(formatTimecode(Number.NaN), "0:00");
  assert.equal(formatTimecode(-5), "0:00");
});

test("clampRatio keeps values inside 0..1 and treats NaN as 0", () => {
  assert.equal(clampRatio(-0.4), 0);
  assert.equal(clampRatio(0.5), 0.5);
  assert.equal(clampRatio(1.8), 1);
  assert.equal(clampRatio(Number.NaN), 0);
});

test("ratio and time conversions are inverse within a duration", () => {
  assert.equal(ratioToTime(0.5, 120), 60);
  assert.equal(ratioToTime(2, 120), 120);
  assert.equal(timeToRatio(60, 120), 0.5);
  assert.equal(timeToRatio(200, 120), 1);
  // Degenerate durations collapse to 0 instead of NaN/Infinity.
  assert.equal(ratioToTime(0.5, 0), 0);
  assert.equal(timeToRatio(30, 0), 0);
});

test("qualityLabel maps template ids to resolution labels", () => {
  assert.equal(qualityLabel("FHD"), "1080p");
  assert.equal(qualityLabel("hd"), "720p");
  assert.equal(qualityLabel("LD"), "360p");
  assert.equal(qualityLabel("WEIRD"), "WEIRD");
  assert.equal(qualityLabel(undefined), "自动");
});

test("pickInitialQuality honours a remembered choice when still offered", () => {
  const variants = [
    { quality: "FHD", url: "f" },
    { quality: "HD", url: "h" },
    { quality: "SD", url: "s" },
  ];
  assert.equal(pickInitialQuality(variants, "HD"), "HD");
  assert.equal(pickInitialQuality(variants, "QHD"), "FHD");
  assert.equal(pickInitialQuality(variants, null), "FHD");
  assert.equal(pickInitialQuality([], "HD"), undefined);
});
