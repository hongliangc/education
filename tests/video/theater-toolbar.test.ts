import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("theater toolbar scrolls away while the page keeps a right-side back-to-top control", () => {
  const topBarSource = readFileSync("components/video/TheaterTopBar.tsx", "utf8");
  const pageSource = readFileSync("app/(game)/theater/page.tsx", "utf8");
  const backToTopSource = readFileSync("components/video/BackToTop.tsx", "utf8");

  assert.doesNotMatch(topBarSource, /\bsticky\b|\bfixed\b/);
  assert.match(pageSource, /<BackToTop\s*\/>/);
  assert.match(backToTopSource, /\bfixed\b/);
  assert.match(backToTopSource, /\bright-6\b/);
  assert.match(backToTopSource, /aria-label="回到顶部"/);
});
