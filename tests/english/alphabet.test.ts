import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { ALPHABET, ALPHABET_SONG_LINES, ALPHABET_SONG_OUTRO } from "../../content/english/alphabet.ts";

test("ALPHABET contains the 26 letters A-Z in order", () => {
  assert.equal(ALPHABET.length, 26);
  assert.deepEqual(
    ALPHABET.map((entry) => entry.letter),
    Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
  );
});

test("every alphabet entry extends its letter word with name, lowercase, and IPA sound", () => {
  for (const entry of ALPHABET) {
    assert.ok(entry.name.trim().length > 0, `name for ${entry.letter}`);
    assert.equal(entry.lower, entry.letter.toLowerCase(), `lowercase for ${entry.letter}`);
    assert.ok(entry.word.length > 0, `word for ${entry.letter}`);
    assert.ok(entry.emoji.length > 0, `emoji for ${entry.letter}`);
    assert.ok(entry.soundIpa.length > 0, `soundIpa for ${entry.letter}`);
    assert.ok(entry.soundSay.trim().length > 0, `soundSay for ${entry.letter}`);
  }
});

test("alphabet song lines contain A-Z exactly once in order", () => {
  const letters = ALPHABET_SONG_LINES.flat();
  assert.equal(letters.length, 26);
  assert.deepEqual(letters, Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"));
  assert.equal(new Set(letters).size, 26);
});

test("alphabet song has a non-empty outro", () => {
  assert.ok(ALPHABET_SONG_OUTRO.trim().length > 0);
});
