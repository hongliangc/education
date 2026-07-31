import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("fairy guide exposes the five learning events", () => {
  assert.equal(existsSync("lib/fairy-guide.ts"), true);
  const contract = read("lib/fairy-guide.ts");
  for (const event of ["enter", "hint", "correct", "incorrect", "complete"]) {
    assert.match(contract, new RegExp(`\\b${event}\\b`));
  }
  assert.match(contract, /CustomEvent/);
  assert.match(contract, /setTimeout/);
});

test("fairy sprite uses the supplied illustrated mascot", () => {
  const sprite = read("components/fairy/FairySprite.tsx");
  assert.match(sprite, /ui\/mascot\/fairy-guide/);
  assert.doesNotMatch(sprite, /<svg/);
});

test("game layout mounts one global fairy guide", () => {
  const layout = read("app/(game)/layout.tsx");
  assert.match(layout, /FairyGuideProvider/);
});

test("world greets through the global guide instead of a duplicate fairy", () => {
  const world = read("app/(game)/world/page.tsx");
  assert.match(world, /showFairyGuide/);
  assert.doesNotMatch(world, /FairyBubble|FairyChat/);
});

test("global fairy stays out of isolated visual-reference fixtures", () => {
  const provider = read("components/fairy/FairyGuideProvider.tsx");
  assert.match(provider, /useVisualQa/);
});

test("English entry and answers use fairy guidance", () => {
  const hub = read("components/games/english/EnglishHub.tsx");
  const game = read("components/games/AlphabetGame.tsx");
  assert.match(hub, /showFairyGuide/);
  assert.doesNotMatch(hub, /魔法学习王国/);
  assert.match(game, /event: ok \? "correct" : "incorrect"/);
  assert.match(game, /event: "complete"/);
});

test("Hanzi starts with today's task and fairy guidance", () => {
  const home = read("components/games/hanzi/HanziLearningHome.tsx");
  const game = read("components/games/WritingGame.tsx");
  assert.match(home, /今天学[\s\S]*个字/);
  assert.match(home, /查看全部学习目录/);
  assert.match(game, /showFairyGuide/);
});

test("Hanzi recognition and writing report learning feedback", () => {
  const recognition = read("components/games/hanzi/HanziRecognitionRound.tsx");
  const writing = read("components/games/hanzi/HanziWritingPractice.tsx");
  assert.match(recognition, /event: ok \? "correct" : "incorrect"/);
  assert.match(recognition, /event: "complete"/);
  assert.match(writing, /event: "correct"/);
  assert.match(writing, /event: "complete"/);
});

test("Words and Math use the shared fairy feedback", () => {
  for (const path of [
    "components/games/WordsGame.tsx",
    "components/games/words/WordMatchingRound.tsx",
    "components/games/words/WordContextRound.tsx",
    "components/games/math/MathCategories.tsx",
    "components/games/math/MathRound.tsx",
  ]) {
    assert.match(read(path), /showFairyGuide/, path);
  }
});

test("Story uses a compact hero and shared fairy feedback", () => {
  const home = read("app/(game)/story/page.tsx");
  const reader = read("components/games/story/ChapterReader.tsx");
  assert.match(home, /showFairyGuide/);
  assert.match(home, /max-h-72/);
  assert.match(reader, /event: ok \? "correct" : "incorrect"/);
  assert.match(reader, /event: "complete"/);
});

test("Literature uses illustrated covers and shared fairy feedback", () => {
  const home = read("app/(game)/literature/page.tsx");
  const deck = read("components/games/literature/QuoteDeckPlayer.tsx");
  assert.match(home, /showFairyGuide/);
  assert.match(home, /next\/image/);
  assert.doesNotMatch(home, /text-5xl/);
  assert.match(deck, /event: ok \? "correct" : "incorrect"/);
  assert.match(deck, /event: "complete"/);
});

test("an open contextual fairy chat hides the global fairy entry", () => {
  const chat = read("components/fairy/FairyChat.tsx");
  const provider = read("components/fairy/FairyGuideProvider.tsx");
  assert.match(chat, /FAIRY_CHAT_STATE_EVENT/);
  assert.match(provider, /FAIRY_CHAT_STATE_EVENT/);
});

test("History uses the global guide without a duplicate local fairy", () => {
  const history = read("app/(game)/history/page.tsx");
  const detail = read("app/(game)/history/three-kingdoms/page.tsx");
  assert.match(history, /showFairyGuide/);
  assert.match(detail, /showFairyGuide/);
  assert.doesNotMatch(detail, /FairyBubble|FairyChat/);
});

test("Theater playback can hide the global fairy overlay", () => {
  const theater = read("app/(game)/theater/page.tsx");
  const hero = read("components/video/TheaterHero.tsx");
  const provider = read("components/fairy/FairyGuideProvider.tsx");
  assert.match(theater, /FAIRY_OVERLAY_STATE_EVENT/);
  assert.match(provider, /FAIRY_OVERLAY_STATE_EVENT/);
  assert.match(hero, /text-white/);
});

test("Shop empty states remain readable and actionable", () => {
  const shop = read("app/(game)/shop/page.tsx");
  const redemptions = read("components/shop/MyRedemptions.tsx");
  assert.match(shop, /返回世界继续冒险/);
  assert.match(redemptions, /storybook-paper/);
});

test("Readers use illustrated fallbacks instead of primary emoji artwork", () => {
  const stage = read("components/games/story/IllustrationStage.tsx");
  const catalog = read("components/story/BookChapterCatalog.tsx");
  assert.match(stage, /fallbackImage/);
  assert.doesNotMatch(stage, /text-7xl/);
  assert.match(catalog, /next\/image/);
  assert.doesNotMatch(catalog, /text-6xl/);
});
