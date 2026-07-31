import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("login uses the illustrated brand lockup", () => {
  assert.match(read("app/(auth)/login/page.tsx"), /brand\/kingdom-logo/);
});

test("child selection uses illustrated child portraits", () => {
  assert.match(read("app/(game)/child-select/page.tsx"), /characters\/child-explorer/);
});

test("story shelf uses illustrated cover art instead of emoji-only cards", () => {
  const source = read("app/(game)/story/page.tsx");
  assert.match(source, /story\/storybook-hero/);
  assert.doesNotMatch(source, /className="text-5xl text-center"/);
});

test("key child screens share the paper panel treatment", () => {
  const sources = [
    "app/(auth)/login/page.tsx",
    "app/(game)/child-select/page.tsx",
    "components/games/english/EnglishHub.tsx",
    "app/(game)/story/page.tsx",
    "app/(game)/shop/page.tsx",
  ].map(read);

  for (const source of sources) assert.match(source, /storybook-paper/);
});

test("95 percent visual mode is isolated from production data", () => {
  assert.equal(existsSync("lib/visual-qa.ts"), true);
  const source = read("lib/visual-qa.ts");
  assert.match(source, /visual=1/);
  assert.doesNotMatch(source, /fetch\(|prisma|\/api\//i);
});

test("reference screens use dedicated visual fixtures", () => {
  const expected = [
    ["app/(game)/child-select/page.tsx", /VisualChildSelect/],
    ["components/games/english/EnglishHub.tsx", /VisualEnglishHub/],
    ["app/(game)/play/[module]/page.tsx", /VisualEnglishQuiz/],
    ["app/(game)/story/[bookId]/page.tsx", /VisualStoryReader/],
    ["app/(game)/shop/page.tsx", /VisualShop/],
  ] as const;

  for (const [path, pattern] of expected) assert.match(read(path), pattern);
});

test("reference-specific artwork exists as standalone assets", () => {
  const assets = [
    "public/ui/characters/child-girl-star-v1.png",
    "public/ui/characters/child-girl-sweet-v1.png",
    "public/ui/english/apple-v1.png",
    "public/ui/english/ball-v1.png",
    "public/ui/english/cat-v1.png",
    "public/ui/shop/magic-hat-v1.png",
    "public/ui/shop/rainbow-wings-v1.png",
    "public/ui/shop/baby-dragon-v1.png",
    "public/ui/shop/castle-music-box-v1.png",
  ];

  for (const path of assets) assert.equal(existsSync(path), true, path);
});
