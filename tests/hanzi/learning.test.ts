import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { buildHanziDashboard, getHanziAgeBand, getHanziLearningLimits } from "../../content/hanzi/learning.ts";
import type { HanziItem } from "../../content/hanzi/catalog.ts";
import type { HanziProgressMap } from "../../content/hanzi/progress.ts";

const DAY = 24 * 60 * 60 * 1000;

test("grade maps to early or primary age band", () => {
  assert.equal(getHanziAgeBand("K1"), "early");
  assert.equal(getHanziAgeBand("K2"), "early");
  assert.equal(getHanziAgeBand("K3"), "early");
  assert.equal(getHanziAgeBand("G1"), "primary");
  assert.equal(getHanziAgeBand("G3"), "primary");
});

test("early learners receive at most one new character per dashboard queue", () => {
  const now = Date.UTC(2026, 6, 10);
  const items = [makeItem("G1-一", "一"), makeItem("G1-二", "二"), makeItem("G1-三", "三")];

  const dashboard = buildHanziDashboard(items, {}, "K1", now);

  assert.equal(getHanziLearningLimits("early").maxNewPerRound, 1);
  assert.equal(dashboard.queue.filter((item) => item.reason === "new").length, 1);
});

test("dashboard prioritizes practice, then review, then new and excludes known", () => {
  const now = Date.UTC(2026, 6, 10);
  const items = [
    makeItem("G1-一", "一"),
    makeItem("G1-二", "二"),
    makeItem("G1-三", "三"),
    makeItem("G1-四", "四"),
    makeItem("G1-五", "五"),
  ];
  const progress: HanziProgressMap = {
    "G1-一": { attempts: 4, correctStreak: 0, lastPracticedAt: now - DAY },
    "G1-二": { attempts: 3, correctStreak: 3, lastPracticedAt: now - 5 * DAY, nextReviewAt: now - DAY },
    "G1-三": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now + DAY },
  };

  const dashboard = buildHanziDashboard(items, progress, "G2", now);

  assert.deepEqual(
    dashboard.queue.map((item) => `${item.reason}:${item.item.id}`),
    ["practice:G1-一", "review:G1-二", "new:G1-四", "new:G1-五"],
  );
  assert.deepEqual(dashboard.mastered.map((item) => item.id), ["G1-三"]);
  assert.equal(dashboard.counts.practice, 3);
  assert.equal(dashboard.counts.review, 1);
  assert.equal(dashboard.counts.known, 1);
});

function makeItem(id: string, char: string): HanziItem {
  return {
    id,
    level: "G1",
    char,
    pinyin: char,
    meaning: `汉字${char}`,
    words: [`${char}字`, `学习${char}`],
    story: `认识${char}`,
    tags: ["test"],
    groupId: "G1-test",
    groupTitle: "测试组",
    groupPhrase: "一二三四五",
    groupOrder: 0,
    charOrder: 0,
  };
}
