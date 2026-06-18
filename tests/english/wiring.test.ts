import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("world map routes the alphabet module to the English hub", () => {
  const source = readFileSync("app/(game)/world/page.tsx", "utf8");

  assert.match(source, /ALPHABET:\s*"\/english"/);
});

test("English hub is mounted in the game route group and demo redirects there", () => {
  const englishPage = readFileSync("app/(game)/english/page.tsx", "utf8");
  const demoPage = readFileSync("app/english-demo/page.tsx", "utf8");

  assert.match(englishPage, /<EnglishHub \/>/);
  assert.match(demoPage, /redirect\("\/english"\)/);
});
