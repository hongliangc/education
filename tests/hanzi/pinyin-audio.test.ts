import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";

test("pinyin audio manifest covers base sounds and only valid tone examples", () => {
  const modulePath = "content/hanzi/pinyin-audio.ts";
  const manifestPath = "scripts/pinyin-audio-items.json";
  assert.equal(existsSync(modulePath), true, "static pinyin audio manifest is missing");
  assert.equal(existsSync(manifestPath), true, "generated Polly manifest is missing");
  const items = JSON.parse(readFileSync(manifestPath, "utf8")) as { kind: string; path: string }[];
  const baseItems = items.filter((item) => item.kind === "base");
  const toneItems = items.filter((item) => item.kind === "tone");

  assert.equal(baseItems.length, 63);
  assert.ok(toneItems.length > 0);
  assert.equal(new Set(items.map((item) => item.path)).size, 63 + toneItems.length);
  assert.ok(items.every((item) => item.path.startsWith("/audio/pinyin/")));
});

test("initials have no tones and every tone card has a matching syllable and character", () => {
  const items = JSON.parse(readFileSync("scripts/pinyin-audio-items.json", "utf8")) as { id: string; kind: string; phoneme: string; fallback: string }[];
  const initialTone = items.find((item) => item.kind === "tone" && item.id.startsWith("initial-"));
  assert.equal(initialTone, undefined, `${initialTone?.id ?? "initial"} must not be taught with four tones`);
  const expectedInitials: Readonly<Record<string, string>> = {
    b: "bo1", p: "po1", m: "mo1", f: "fo1", d: "de1", t: "te1", n: "ne1", l: "le1",
    g: "ge1", k: "ke1", h: "he1", j: "ji1", q: "qi1", x: "xi1", zh: "zhi1", ch: "chi1",
    sh: "shi1", r: "ri1", z: "zi1", c: "ci1", s: "si1", y: "yi1", w: "wu1",
  };
  for (const [initial, phoneme] of Object.entries(expectedInitials)) {
    const item = items.find((candidate) => candidate.id === `initial-${initial}-base`);
    assert.equal(item?.phoneme, phoneme, `${initial} needs a clear teaching pronunciation`);
    assert.ok(item?.fallback, `${initial} needs a matching teaching character`);
  }

  for (const item of items.filter((candidate) => candidate.kind === "tone")) {
    assert.match(item.phoneme, /[1-4]$/);
    assert.ok(item.fallback.length > 0);
  }
});

test("final tone labels use child-friendly full-syllable examples", () => {
  const items = JSON.parse(readFileSync("scripts/pinyin-audio-items.json", "utf8")) as { id: string; phoneme: string; fallback: string }[];
  assert.deepEqual(
    items.filter((item) => item.id.startsWith("compound-final-ui-tone-")).map(({ phoneme, fallback }) => ({ phoneme, fallback })),
    [
      { phoneme: "gui1", fallback: "龟" },
      { phoneme: "hui2", fallback: "回" },
      { phoneme: "shui3", fallback: "水" },
      { phoneme: "dui4", fallback: "对" },
    ],
  );
});

test("every Polly manifest item has a non-empty static MP3", () => {
  const items = JSON.parse(readFileSync("scripts/pinyin-audio-items.json", "utf8")) as { id: string; path: string }[];
  for (const item of items) {
    const file = `public${item.path}`;
    assert.equal(existsSync(file), true, `${item.id} is missing`);
    assert.ok(statSync(file).size > 100, `${item.id} is empty`);
    if (item.id.startsWith("initial-") && item.id.endsWith("-base")) {
      assert.ok(statSync(file).size > 1_000, `${item.id} is too short for a clear teaching sound`);
    }
  }
});

test("pinyin foundation plays static clips instead of runtime pinyin TTS", () => {
  const board = readFileSync("components/games/hanzi/PinyinFoundationBoard.tsx", "utf8");
  const lesson = readFileSync("components/games/hanzi/HanziPinyinLesson.tsx", "utf8");

  assert.match(board, /pinyinAudioPath/);
  assert.match(board, /pinyinToneAudioPath/);
  assert.match(board, /selected\.phonemeBase/);
  assert.match(board, /selected\.fallback/);
  assert.match(lesson, /playClip/);
  assert.match(lesson, /playClipSequence/);
});

test("reusable Polly generator is pinned to Tokyo and Zhiyu neural", () => {
  const scriptPath = "scripts/gen-pinyin-audio.py";
  assert.equal(existsSync(scriptPath), true, "Polly generator is missing");
  const script = readFileSync(scriptPath, "utf8");

  assert.match(script, /ap-northeast-1/);
  assert.match(script, /Zhiyu/);
  assert.match(script, /neural/);
  assert.match(script, /x-amazon-pinyin/);
});
