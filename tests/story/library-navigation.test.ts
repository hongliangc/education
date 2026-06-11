import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync("app/(game)/story/page.tsx", "utf8");

test("story library exposes a visible control that returns to the world", () => {
  const returnButton = [...source.matchAll(/<BackButton\b[\s\S]*?\/>/g)].find(
    ([button]) =>
      button.includes('label="返回世界"') &&
      /onClick=\{[\s\S]*?router\.push\("\/world"\)[\s\S]*?\}/.test(button),
  );

  assert.ok(returnButton, "missing a BackButton whose own handler navigates to /world");
});

test("story library section headings use a clear second-level hierarchy", () => {
  for (const heading of ["长篇故事", "短篇绘本"]) {
    const match = source.match(
      new RegExp(`<h2\\b[^>]*className="([^"]*)"[^>]*>${heading}<\\/h2>`),
    );

    assert.ok(match, `missing semantic h2 for ${heading}`);
    assert.match(match[1], /\btext-(?:xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/);
    assert.match(match[1], /\bfont-bold\b/);
  }
});
