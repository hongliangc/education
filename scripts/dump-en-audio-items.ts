// Enumerate every English audio item spoken in the 字母 + 音标 modules, so the
// Polly generator (scripts/gen-en-audio.py) can pre-synthesize one clip each.
// Output: scripts/en-audio-items.json — [{ slug, kind: "chars"|"ipa"|"word", value }].
//   chars -> letter name via <say-as interpret-as="characters"> (value = the letter)
//   ipa   -> a sound via <phoneme alphabet="ipa" ph="…">      (value = IPA, no slashes)
//   word  -> an example word, plain                            (value = the word)
// Phoneme SOUNDS for the IPA board are generated separately (scripts/gen-phoneme-audio.py)
// and keyed by phoneme id under public/audio/phonemes/.
// Run: node --experimental-strip-types scripts/dump-en-audio-items.ts
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { ALPHABET, ALPHABET_SONG_OUTRO } from "../content/english/alphabet.ts";
// @ts-expect-error explicit extension for the node TS runner
import { IPA_PHONEMES } from "../content/english/ipa.ts";
import { writeFileSync } from "node:fs";

// MUST match enAudioSlug() in lib/speech.ts.
const slug = (s: string): string =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type Item = { slug: string; kind: "chars" | "ipa" | "word"; value: string };
const items: Item[] = [];
const seen = new Set<string>();
const add = (key: string, kind: Item["kind"], value: string) => {
  if (!key || seen.has(key)) return;
  seen.add(key);
  items.push({ slug: key, kind, value });
};

for (const e of ALPHABET as ReadonlyArray<{
  letter: string;
  name: string;
  soundSay: string;
  soundIpa: string;
  word: string;
}>) {
  add(slug(e.name), "chars", e.letter); // letter name (A → "ay")
  add(slug(e.soundSay), "ipa", e.soundIpa.replace(/\//g, "")); // phonics sound (A → /æ/)
  add(slug(e.word), "word", e.word); // example word (apple)
}
for (const p of IPA_PHONEMES as ReadonlyArray<{ examples: ReadonlyArray<{ word: string }> }>) {
  for (const ex of p.examples) add(slug(ex.word), "word", ex.word);
}
add(slug(ALPHABET_SONG_OUTRO as string), "word", ALPHABET_SONG_OUTRO as string); // 字母歌结尾

writeFileSync("scripts/en-audio-items.json", JSON.stringify(items, null, 2) + "\n");
console.log(`en audio items: ${items.length}`);
