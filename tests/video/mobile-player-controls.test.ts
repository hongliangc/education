import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("mobile player controls use input modality instead of width breakpoints", async () => {
  const source = await readFile(
    new URL("../../components/video/VideoControls.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const\s+compact\s*=\s*useCoarsePointer\(\)/);
  assert.doesNotMatch(
    source,
    /hidden sm:flex|sm:hidden/,
    "touch controls must not switch to desktop layout just because iPhone landscape is wider than sm",
  );
});

test("fullscreen touch controls expose the fit/fill toggle", async () => {
  const source = await readFile(
    new URL("../../components/video/VideoControls.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /onToggleFill/);
  assert.match(source, /AspectFillIcon/);
  assert.match(source, /AspectFitIcon/);
  assert.match(source, /aria-label=\{filled \? "适应屏幕" : "铺满屏幕"\}/);
});
