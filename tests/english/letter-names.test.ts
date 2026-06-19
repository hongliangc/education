import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { ALPHABET } from "../../content/english/alphabet.ts";

const nameOf = (letter: string): string | undefined =>
  ALPHABET.find((e: { letter: string; name: string }) => e.letter === letter)?.name;

test("A/R use browser-friendly spellings (original ay/ar mispronounced)", () => {
  assert.equal(nameOf("A"), "eigh");
  assert.equal(nameOf("R"), "are");
  // H stays the browser-good standard spelling.
  assert.equal(nameOf("H"), "aitch");
  for (const bad of ["ay", "ar"]) {
    assert.ok(
      !ALPHABET.some((e: { name: string }) => e.name === bad),
      `letter name "${bad}" mispronounces`,
    );
  }
});

test("English speech is routed to the browser voice, not Tencent cloud TTS", () => {
  const speech = readFileSync("lib/speech.ts", "utf8");
  // speakText skips the cloud path for English; stream/chunks delegate to it.
  assert.match(speech, /!lang\.startsWith\("en"\) && !cloudTtsUnavailable/);
  assert.match(speech, /typeof window === "undefined" \|\| lang\.startsWith\("en"\)/);
  assert.match(speech, /if \(lang\.startsWith\("en"\)\) return speakText\(text, opts\)/);
});
