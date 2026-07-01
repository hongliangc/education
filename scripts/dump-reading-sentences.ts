// Enumerate every English sentence across the active 双语阅读 stories so the Polly generator
// (scripts/gen-reading-audio.py) can pre-synthesize one Joanna female-voice clip each, offline.
// Output: scripts/reading-audio-items.json — [{ file, text }].
//   file -> filesystem path under public/ where the mp3 should be written (mirrors ReadingSentence.audio)
//   text -> the English sentence (the python wraps it in SSML with a gentle pace + a short end pause)
// Run: node --experimental-strip-types scripts/dump-reading-sentences.ts
// Import each active story directly (like dump-en-audio-items.ts) — the registry (content/reading/index.ts)
// can't be loaded by the Node runner (its story import is extensionless for the app build), but the
// story files use only `import type` so they load fine. Add a new story's import here when it goes live.
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { antsAndTheGrasshopper } from "../content/reading/ants-and-the-grasshopper.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { boyWhoCriedWolf } from "../content/reading/boy-who-cried-wolf.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { bremenTownMusicians } from "../content/reading/bremen-town-musicians.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { elvesAndTheShoemaker } from "../content/reading/elves-and-the-shoemaker.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { emperorsNewClothes } from "../content/reading/emperors-new-clothes.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { frogPrince } from "../content/reading/frog-prince.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { lionAndTheMouse } from "../content/reading/lion-and-the-mouse.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { northWindAndTheSun } from "../content/reading/north-wind-and-the-sun.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { townMouseAndCountryMouse } from "../content/reading/town-mouse-and-country-mouse.ts";
// @ts-expect-error Node's native TypeScript runner needs the explicit extension.
import { uglyDuckling } from "../content/reading/ugly-duckling.ts";
import { writeFileSync } from "node:fs";

const STORIES = [
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

type Item = { file: string; text: string };

const items: Item[] = [];
for (const story of STORIES) {
  for (const s of story.sentences) {
    // s.audio is the web path (/audio/reading/<id>/NN.mp3); the file lives under public/.
    items.push({ file: `public${s.audio}`, text: s.en });
  }
}

writeFileSync("scripts/reading-audio-items.json", JSON.stringify(items, null, 2) + "\n");
console.log(`reading audio items: ${items.length}`);
