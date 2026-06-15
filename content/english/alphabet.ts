// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { LETTER_WORDS } from "../phonics.ts";

export interface AlphabetEntry {
  letter: string;
  name: string;
  lower: string;
  word: string;
  emoji: string;
  soundIpa: string;
  /** TTS 能念出的自然拼读「字母音」近似词（IPA 无法直接合成，故用可朗读近似）。 */
  soundSay: string;
}

const LETTER_NAMES: readonly string[] = [
  "ay",
  "bee",
  "see",
  "dee",
  "ee",
  "eff",
  "jee",
  "aitch",
  "eye",
  "jay",
  "kay",
  "el",
  "em",
  "en",
  "oh",
  "pee",
  "cue",
  "ar",
  "ess",
  "tee",
  "you",
  "vee",
  "double-u",
  "ex",
  "why",
  "zee",
];

const LETTER_SOUNDS: readonly string[] = [
  "/æ/",
  "/b/",
  "/k/",
  "/d/",
  "/e/",
  "/f/",
  "/g/",
  "/h/",
  "/ɪ/",
  "/dʒ/",
  "/k/",
  "/l/",
  "/m/",
  "/n/",
  "/ɒ/",
  "/p/",
  "/kw/",
  "/r/",
  "/s/",
  "/t/",
  "/ʌ/",
  "/v/",
  "/w/",
  "/ks/",
  "/j/",
  "/z/",
];

// 自然拼读「字母音」的 TTS 近似念法（en-US）。元音用近似元音词，辅音用「子音+schwa」。
// 这些是 TTS 能稳定念出的近似，不是精准 IPA——可按真人听感逐个微调。
const LETTER_SOUNDS_SAY: readonly string[] = [
  "ah", // A /æ/
  "buh", // B
  "kuh", // C
  "duh", // D
  "eh", // E /e/
  "fuh", // F
  "guh", // G
  "huh", // H
  "ih", // I /ɪ/
  "juh", // J
  "kuh", // K
  "luh", // L
  "muh", // M
  "nuh", // N
  "aw", // O /ɒ/
  "puh", // P
  "kwuh", // Q
  "ruh", // R
  "suh", // S
  "tuh", // T
  "uh", // U /ʌ/
  "vuh", // V
  "wuh", // W
  "ks", // X
  "yuh", // Y
  "zuh", // Z
];

export const ALPHABET: readonly AlphabetEntry[] = LETTER_WORDS.map((entry, index) => ({
  ...entry,
  name: LETTER_NAMES[index],
  lower: entry.letter.toLowerCase(),
  soundIpa: LETTER_SOUNDS[index],
  soundSay: LETTER_SOUNDS_SAY[index],
}));

export const ALPHABET_SONG_LINES: readonly (readonly string[])[] = [
  ["A", "B", "C", "D", "E", "F", "G"],
  ["H", "I", "J", "K", "L", "M", "N", "O", "P"],
  ["Q", "R", "S"],
  ["T", "U", "V"],
  ["W", "X"],
  ["Y", "Z"],
];

export const ALPHABET_SONG_OUTRO = "Now I know my ABCs!";
