import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import type { BilingualStory } from "../../content/reading/types";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { antsAndTheGrasshopper } from "../../content/reading/ants-and-the-grasshopper.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { boyWhoCriedWolf } from "../../content/reading/boy-who-cried-wolf.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { bremenTownMusicians } from "../../content/reading/bremen-town-musicians.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { elvesAndTheShoemaker } from "../../content/reading/elves-and-the-shoemaker.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { emperorsNewClothes } from "../../content/reading/emperors-new-clothes.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { frogPrince } from "../../content/reading/frog-prince.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { lionAndTheMouse } from "../../content/reading/lion-and-the-mouse.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { northWindAndTheSun } from "../../content/reading/north-wind-and-the-sun.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { townMouseAndCountryMouse } from "../../content/reading/town-mouse-and-country-mouse.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { uglyDuckling } from "../../content/reading/ugly-duckling.ts";

const STORIES: BilingualStory[] = [
  lionAndTheMouse,
  boyWhoCriedWolf,
  northWindAndTheSun,
  antsAndTheGrasshopper,
  townMouseAndCountryMouse,
  elvesAndTheShoemaker,
  bremenTownMusicians,
  frogPrince,
  uglyDuckling,
  emperorsNewClothes,
];

// The pilot 双语阅读 story. Guards the data shape the reader and the offline Polly generator both rely
// on: stable per-sentence ids, clip paths matching /audio/reading/<id>/<NN>.mp3, and paired bilingual
// text. (The full ten-story registry in index.ts is static data tsc type-checks; the Node runner can't
// load it because its story import is extensionless for the app build, so we exercise the story here.)
test("the bilingual reading library has ten playable public-domain stories", () => {
  assert.equal(STORIES.length, 10);
  assert.equal(new Set(STORIES.map((story) => story.id)).size, STORIES.length);
  STORIES.forEach((story) => {
    assert.ok(story.titleEn.trim().length > 0, `${story.id} missing English title`);
    assert.ok(story.titleZh.trim().length > 0, `${story.id} missing Chinese title`);
    assert.ok(story.emoji.length > 0, `${story.id} missing emoji`);
    assert.ok(story.sentences.length >= 8, `${story.id} should have enough reading lines`);
    assert.equal(story.illustrations?.length, 3, `${story.id} should have three illustrations`);
  });
});

test("the pilot story has sound metadata", () => {
  assert.equal(lionAndTheMouse.id, "lion-and-the-mouse");
  assert.ok(lionAndTheMouse.titleEn.trim().length > 0, "missing English title");
  assert.ok(lionAndTheMouse.titleZh.trim().length > 0, "missing Chinese title");
  assert.ok(lionAndTheMouse.emoji.length > 0, "missing emoji");
  assert.ok(lionAndTheMouse.sentences.length >= 8, "a fable should have a handful of sentences");
});

test("the pilot story uses the public-domain Aesop wording", () => {
  const text = lionAndTheMouse.sentences.map((s) => s.en).join(" ");
  const words = text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  assert.ok(text.startsWith("A Lion lay asleep in the forest"));
  assert.ok(text.includes("A kindness is never wasted."));
  assert.equal(words.length, 193);
});

test("the pilot story has three story-beat illustrations", () => {
  assert.equal(lionAndTheMouse.illustrations?.length, 3);
  const sentenceIds = new Set(lionAndTheMouse.sentences.map((s) => s.id));
  lionAndTheMouse.illustrations?.forEach((pic, i) => {
    const expected = `/images/reading/${lionAndTheMouse.id}/${String(i + 1).padStart(2, "0")}.png`;
    assert.equal(pic.src, expected, `#${i + 1} illustration path mismatch`);
    assert.ok(pic.alt.trim().length > 0, `#${i + 1} missing alt text`);
    assert.ok(sentenceIds.has(pic.fromSentenceId), `#${i + 1} anchor sentence missing`);
    assert.ok(existsSync(`public${pic.src}`), `#${i + 1} illustration file missing`);
  });
});

test("every sentence is well-formed and consistently keyed", () => {
  STORIES.forEach((story) => {
    const ids = new Set<string>();
    story.sentences.forEach((s, i) => {
      assert.ok(s.en.trim().length > 0, `${story.id} #${i + 1} empty English`);
      assert.ok(s.zh.trim().length > 0, `${story.id} #${i + 1} empty Chinese`);
      assert.ok(!ids.has(s.id), `${story.id} duplicate sentence id ${s.id}`);
      ids.add(s.id);
      // Clip path must match /audio/reading/<storyId>/<NN>.mp3 with the 1-based index.
      const expected = `/audio/reading/${story.id}/${String(i + 1).padStart(2, "0")}.mp3`;
      assert.equal(s.audio, expected, `${story.id} #${i + 1} audio path mismatch`);
    });
  });
});

test("every story has three existing story-beat illustrations", () => {
  STORIES.forEach((story) => {
    const sentenceIds = new Set(story.sentences.map((s) => s.id));
    story.illustrations?.forEach((pic, i) => {
      const expected = `/images/reading/${story.id}/${String(i + 1).padStart(2, "0")}.png`;
      assert.equal(pic.src, expected, `${story.id} #${i + 1} illustration path mismatch`);
      assert.ok(pic.alt.trim().length > 0, `${story.id} #${i + 1} missing alt text`);
      assert.ok(sentenceIds.has(pic.fromSentenceId), `${story.id} #${i + 1} anchor sentence missing`);
      assert.ok(existsSync(`public${pic.src}`), `${story.id} #${i + 1} illustration file missing`);
    });
  });
});
