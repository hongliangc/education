import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { DEFAULT_CHAPTER_COST, applyMigration, planMigration, type MigrationAdapter, type MigrationInput, type OpeningBalanceSpec, type PermanentRedemptionSpec, type PlatformResourceSpec } from "../../lib/rewards/migration.ts";

class FakeMigrationAdapter implements MigrationAdapter {
  readonly resources = new Map<string, { id: string; spec: PlatformResourceSpec }>();
  readonly openingBalances = new Map<string, OpeningBalanceSpec>();
  readonly redemptions = new Map<
    string,
    { resourceId: string; spec: PermanentRedemptionSpec }
  >();
  resourceCreates = 0;
  openingBalanceCreates = 0;
  redemptionCreates = 0;
  private seq = 0;

  async ensureResource(spec: PlatformResourceSpec): Promise<string> {
    const key = `${spec.scopeKey}|${spec.resourceType}|${spec.resourceKey}`;
    const existing = this.resources.get(key);
    if (existing) return existing.id;
    const id = `res-${(this.seq += 1)}`;
    this.resources.set(key, { id, spec });
    this.resourceCreates += 1;
    return id;
  }

  async ensureOpeningBalance(spec: OpeningBalanceSpec): Promise<void> {
    if (this.openingBalances.has(spec.dedupeKey)) return;
    this.openingBalances.set(spec.dedupeKey, spec);
    this.openingBalanceCreates += 1;
  }

  async ensurePermanentRedemption(
    resourceId: string,
    spec: PermanentRedemptionSpec,
  ): Promise<void> {
    if (this.redemptions.has(spec.unlockKey)) return;
    this.redemptions.set(spec.unlockKey, { resourceId, spec });
    this.redemptionCreates += 1;
  }
}

function fixture(): MigrationInput {
  return {
    children: [
      { id: "child-a", totalStars: 30 },
      { id: "child-b", totalStars: 10 },
    ],
    books: [
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
        id: "abc",
        title: "小红帽",
        kind: "tale",
        chapters: [{ idx: 0, title: "小红帽" }],
      },
    ],
    readingProgress: [
      { childId: "child-a", bookId: "jtw", lastChapterIdx: 1, completedChapters: 2, finished: false },
      { childId: "child-a", bookId: "abc", lastChapterIdx: 0, completedChapters: 1, finished: true },
      { childId: "child-b", bookId: "jtw", lastChapterIdx: 0, completedChapters: 0, finished: false },
    ],
    videoUnlocks: [
      { childId: "child-a", videoId: "v1", starsCost: 5 },
      { childId: "child-b", videoId: "v1", starsCost: 5 },
      { childId: "child-b", videoId: "v2", starsCost: 8 },
    ],
  };
}

test("plan derives one platform resource per content key and forces the first chapter free", () => {
  const plan = planMigration(fixture());
  const byKey = new Map(
    plan.resources.map((resource) => [`${resource.resourceType}:${resource.resourceKey}`, resource]),
  );

  assert.equal(plan.resources.length, 6);
  assert.equal(byKey.get("STORY_CHAPTER:jtw:0")?.starsCost, 0);
  assert.equal(byKey.get("STORY_CHAPTER:jtw:1")?.starsCost, DEFAULT_CHAPTER_COST);
  assert.equal(byKey.get("STORY_CHAPTER:jtw:2")?.starsCost, DEFAULT_CHAPTER_COST);
  assert.ok(byKey.has("STORY_TALE:abc"));
  assert.ok(byKey.has("VIDEO:v1"));
  assert.ok(byKey.has("VIDEO:v2"));
  for (const resource of plan.resources) {
    assert.equal(resource.ownerType, "PLATFORM");
    assert.equal(resource.ownerId, null);
    assert.equal(resource.scopeKey, "PLATFORM");
  }
});

test("running the migration twice is idempotent across resources, balances, and unlocks", async () => {
  const adapter = new FakeMigrationAdapter();
  const input = fixture();

  const first = await applyMigration(adapter, input);
  await applyMigration(adapter, input);

  // One opening balance per child.
  assert.equal(adapter.openingBalanceCreates, 2);
  assert.equal(adapter.openingBalances.get("opening:child-a")?.amount, 30);
  assert.equal(adapter.openingBalances.get("opening:child-b")?.amount, 10);

  // One resource per content key.
  assert.equal(adapter.resourceCreates, 6);

  // One permanent redemption per existing reading/video unlock, no balance change.
  // child-a: jtw:0, jtw:1, abc tale, v1  => 4
  // child-b: jtw:0, v1, v2               => 3
  assert.equal(adapter.redemptionCreates, 7);
  for (const { spec } of adapter.redemptions.values()) {
    assert.equal(spec.starsSpent, 0);
  }
  assert.ok(adapter.redemptions.has("child-a:STORY_CHAPTER:jtw:0"));
  assert.ok(adapter.redemptions.has("child-a:STORY_CHAPTER:jtw:1"));
  assert.ok(!adapter.redemptions.has("child-a:STORY_CHAPTER:jtw:2"));
  assert.ok(adapter.redemptions.has("child-a:STORY_TALE:abc"));
  assert.ok(adapter.redemptions.has("child-b:STORY_CHAPTER:jtw:0"));
  assert.ok(adapter.redemptions.has("child-b:VIDEO:v2"));

  assert.deepEqual(first, { resources: 6, openingBalances: 2, redemptions: 7 });
});
