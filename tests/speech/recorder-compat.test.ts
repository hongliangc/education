import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("lib/speech.ts", "utf8");

test("recorder supports WebKit AudioContext when standard AudioContext is absent", () => {
  assert.match(source, /webkitAudioContext\?: AudioContextConstructor/);
  assert.match(source, /window\.AudioContext \?\? windowWithWebKit\.webkitAudioContext/);
  assert.doesNotMatch(source, /ctx = new AudioContext\(/);
});
