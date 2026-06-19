import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { ALPHABET } from "../../content/english/alphabet.ts";

const nameOf = (letter: string): string | undefined =>
  ALPHABET.find((e: { letter: string; name: string }) => e.letter === letter)?.name;

test("letter names use TTS spellings verified to pronounce correctly", () => {
  // Synth→recognize confirmed these read as the right letter on the en voice.
  assert.equal(nameOf("A"), "eigh");
  assert.equal(nameOf("H"), "aytch");
  assert.equal(nameOf("R"), "are");
  // Guard against regressing to the spellings that mispronounced (A y / I / AR).
  for (const bad of ["ay", "aitch", "ar"]) {
    assert.ok(
      !ALPHABET.some((e: { name: string }) => e.name === bad),
      `letter name "${bad}" mispronounces`,
    );
  }
});
