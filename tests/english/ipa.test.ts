import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { IPA_GROUPS, IPA_PHONEMES, exampleWords, groupInfo, phonemesInGroup } from "../../content/english/ipa.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { matchSpokenWord } from "../../content/english/match.ts";

// General American (GenAm) symbols — relabeled from British RP 2026-06-19.
const EXPECTED_SYMBOLS = [
  "/i/",
  "/ɝ/",
  "/ɑr/",
  "/ɔ/",
  "/u/",
  "/ɪ/",
  "/ɛ/",
  "/æ/",
  "/ə/",
  "/ʌ/",
  "/ɑ/",
  "/ʊ/",
  "/eɪ/",
  "/aɪ/",
  "/ɔɪ/",
  "/ɪr/",
  "/ɛr/",
  "/ʊr/",
  "/oʊ/",
  "/aʊ/",
  "/p/",
  "/b/",
  "/t/",
  "/d/",
  "/k/",
  "/g/",
  "/f/",
  "/v/",
  "/s/",
  "/z/",
  "/θ/",
  "/ð/",
  "/ʃ/",
  "/ʒ/",
  "/h/",
  "/ɹ/",
  "/tʃ/",
  "/dʒ/",
  "/tr/",
  "/dr/",
  "/ts/",
  "/dz/",
  "/m/",
  "/n/",
  "/ŋ/",
  "/j/",
  "/w/",
  "/l/",
] as const;

const EXPECTED_GROUP_COUNTS = new Map([
  ["长元音", 5],
  ["短元音", 7],
  ["双元音", 8],
  ["爆破音", 6],
  ["摩擦音", 10],
  ["破擦音", 6],
  ["鼻音", 3],
  ["半元音", 3],
] as const);

test("IPA_PHONEMES exactly matches the specified 48-symbol sequence", () => {
  assert.equal(IPA_PHONEMES.length, 48);
  assert.deepEqual(
    IPA_PHONEMES.map((phoneme) => phoneme.symbol),
    EXPECTED_SYMBOLS,
  );
  assert.equal(new Set(IPA_PHONEMES.map((phoneme) => phoneme.symbol)).size, 48);
});

test("IPA phonemes contain 20 vowels and 28 consonants in the required groups", () => {
  assert.equal(IPA_PHONEMES.filter((phoneme) => phoneme.kind === "vowel").length, 20);
  assert.equal(IPA_PHONEMES.filter((phoneme) => phoneme.kind === "consonant").length, 28);
  assert.deepEqual(IPA_GROUPS, [...EXPECTED_GROUP_COUNTS.keys()]);

  for (const [group, count] of EXPECTED_GROUP_COUNTS) {
    assert.equal(phonemesInGroup(group).length, count, group);
  }
});

test("every IPA phoneme has complete examples accepted by the closed-set judge", () => {
  for (const phoneme of IPA_PHONEMES) {
    assert.ok(phoneme.examples.length >= 1, `examples for ${phoneme.symbol}`);
    const words = exampleWords(phoneme);
    const candidates = words.map((word) => ({ id: word, en: word }));

    for (const example of phoneme.examples) {
      assert.ok(example.word.length > 0, `word for ${phoneme.symbol}`);
      assert.ok(example.emoji.length > 0, `emoji for ${phoneme.symbol}`);
      assert.ok(example.zh.length > 0, `zh for ${phoneme.symbol}`);
      assert.equal(
        matchSpokenWord(example.word, candidates).matched,
        true,
        `${example.word} should match ${phoneme.symbol}`,
      );
    }
  }
});

test("every IPA phoneme has a substantial alliteration", () => {
  for (const phoneme of IPA_PHONEMES) {
    assert.ok(phoneme.alliteration.trim().length > 0, `alliteration for ${phoneme.symbol}`);
    assert.ok(
      phoneme.alliteration.trim().split(/\s+/).length >= 3,
      `at least three words for ${phoneme.symbol}`,
    );
  }
});

test("every IPA phoneme has a TTS-speakable sound approximation", () => {
  for (const phoneme of IPA_PHONEMES) {
    assert.ok(phoneme.say.trim().length > 0, `say for ${phoneme.symbol}`);
  }
});

test("every IPA group has a non-empty chant and story", () => {
  for (const group of IPA_GROUPS) {
    const info = groupInfo(group);
    assert.ok(info.chant.trim().length > 0, `chant for ${group}`);
    assert.ok(info.story.trim().length > 0, `story for ${group}`);
  }
});
