import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("theater resets player between episodes and keeps loading-state back navigation", () => {
  const page = readFileSync("app/(game)/theater/page.tsx", "utf8");
  const overlay = readFileSync("components/video/VideoStatusOverlay.tsx", "utf8");
  const player = readFileSync("components/video/VideoPlayer.tsx", "utf8");

  assert.match(page, /<VideoPlayer\s+key=\{activeVideo\.id\}/);
  assert.match(page, /createPortal\(\s*<VideoPlayer/);
  assert.match(overlay, /<Btn variant="secondary" onClick=\{onBack\}>\s*返回片库/);
  assert.doesNotMatch(overlay, /\{error && \(/);
  assert.doesNotMatch(player, /controlsVisible \? "opacity-100" : "-translate-y-2 opacity-0"/);
});

test("locked next episode closes the player before showing its unlock prompt", () => {
  const page = readFileSync("app/(game)/theater/page.tsx", "utf8");

  assert.match(
    page,
    /if \(!video\.unlocked\) \{\s*stopPlayback\(\);\s*setPendingUnlock\(video\);/,
  );
});
