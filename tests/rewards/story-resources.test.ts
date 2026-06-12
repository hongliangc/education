import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { storyResourceSpecs } from "../../lib/rewards/story-resources.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { DEFAULT_CHAPTER_COST, DEFAULT_TALE_COST, type MigrationBook } from "../../lib/rewards/migration.ts";

const BOOKS: MigrationBook[] = [
  {
    id: "jtw",
    title: "西游记",
    kind: "novel",
    chapters: [
      { idx: 0, title: "石猴出世" },
      { idx: 1, title: "拜师学艺" },
      { idx: 2, title: "大闹天宫" },
    ],
  },
  {
    id: "little-red",
    title: "小红帽",
    kind: "tale",
    chapters: [{ idx: 0, title: "小红帽" }],
  },
];

// Guards the contract the reward catalog relies on: every story chapter/tale in content
// derives a purchasable platform resource. If this breaks, the catalog hands out a null
// resourceId and the book page silently opens paid chapters for free.
test("every story book derives a purchasable platform resource with correct cost", () => {
  const specs = storyResourceSpecs(BOOKS);
  const byKey = new Map(specs.map((s) => [`${s.resourceType}:${s.resourceKey}`, s]));

  // Four content keys -> four resources, nothing else (no VIDEO/REWARD noise).
  assert.equal(specs.length, 4);
  assert.ok(
    specs.every((s) => s.resourceType === "STORY_CHAPTER" || s.resourceType === "STORY_TALE"),
  );

  // First chapter is free; later chapters cost the platform default; tales use the tale default.
  assert.equal(byKey.get("STORY_CHAPTER:jtw:0")?.starsCost, 0);
  assert.equal(byKey.get("STORY_CHAPTER:jtw:1")?.starsCost, DEFAULT_CHAPTER_COST);
  assert.equal(byKey.get("STORY_CHAPTER:jtw:2")?.starsCost, DEFAULT_CHAPTER_COST);
  assert.equal(byKey.get("STORY_TALE:little-red")?.starsCost, DEFAULT_TALE_COST);

  // All platform-scoped so the catalog's scopeKey:"PLATFORM" query finds them.
  for (const spec of specs) {
    assert.equal(spec.scopeKey, "PLATFORM");
    assert.equal(spec.ownerType, "PLATFORM");
    assert.equal(spec.ownerId, null);
  }
});
