import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { buildHanziSession } from "../../content/hanzi/scheduler.ts";

const DAY = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 6, 12);

test("session prioritizes practice then due review then ordered new content", () => {
  const session = buildHanziSession({
    unitId: "find-directions",
    selectedIds: [],
    progress: {
      "hanzi:上": { attempts: 1, correctStreak: 0, lastPracticedAt: now - DAY },
      "hanzi:下": { attempts: 3, correctStreak: 3, lastPracticedAt: now - 4 * DAY, nextReviewAt: now - DAY },
      "hanzi:左": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now + DAY },
    },
    grade: "G1",
    now,
    rng: () => 0.4,
  });

  assert.deepEqual(session.items.map(({ item, reason }) => `${reason}:${item.char}`), [
    "practice:上",
    "review:下",
    "new:右",
    "new:东",
    "new:西",
  ]);
  assert.ok(session.items.every(({ item }) => item.char !== "左"));
});

test("free selection stays inside selected ids and does not advance mainline", () => {
  const session = buildHanziSession({
    unitId: "find-directions",
    selectedIds: ["hanzi:天", "hanzi:雨"],
    selectionMode: "free-practice",
    progress: {},
    grade: "G1",
    now,
    rng: () => 0.2,
  });

  assert.deepEqual(new Set(session.items.map(({ item }) => item.id)), new Set(["hanzi:天", "hanzi:雨"]));
  assert.equal(session.advancesMainline, false);
});
