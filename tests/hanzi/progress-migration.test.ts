import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG } from "../../content/hanzi/catalog.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { migrateHanziProgress } from "../../content/hanzi/progress-migration.ts";

test("catalog uses one stable id per character", () => {
  assert.equal(HANZI_CATALOG.find(({ char }) => char === "天")?.id, "hanzi:天");
  assert.equal(new Set(HANZI_CATALOG.map(({ char }) => char)).size, HANZI_CATALOG.length);
});

test("legacy grade ids merge conservatively without losing recent evidence", () => {
  const migrated = migrateHanziProgress({
    "G1-东": { attempts: 2, correctStreak: 2, lastPracticedAt: 10 },
    "G3-东": { attempts: 4, correctStreak: 3, lastPracticedAt: 20, nextReviewAt: 30 },
  });

  assert.equal(migrated.entries["hanzi:东"].attempts, 4);
  assert.equal(migrated.entries["hanzi:东"].correctStreak, 2);
  assert.equal(migrated.entries["hanzi:东"].lastPracticedAt, 20);
  assert.equal(migrated.entries["hanzi:东"].nextReviewAt, 30);
});

test("versioned progress migration is idempotent and preserves unknown legacy data", () => {
  const first = migrateHanziProgress({
    "G9-龘": { attempts: 1, correctStreak: 0, lastPracticedAt: 10 },
    "G1-一": { attempts: 3, correctStreak: 3, lastPracticedAt: 20 },
  });
  const second = migrateHanziProgress(first);

  assert.deepEqual(second, first);
  assert.ok(first.unmapped["G9-龘"]);
});
