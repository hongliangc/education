import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { categorizeHanzi, getHanziStatus, recordHanziResult, selectDueHanzi } from "../../content/hanzi/progress.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateHanziChallenges } from "../../content/hanzi/round-core.ts";

const DAY = 24 * 60 * 60 * 1000;

test("three correct answers mark a hanzi as known until its review date", () => {
  const learnedAt = Date.UTC(2026, 5, 30);
  const progress = recordHanziResult(
    recordHanziResult(recordHanziResult({}, "G1-一", true, learnedAt), "G1-一", true, learnedAt),
    "G1-一",
    true,
    learnedAt,
  );

  assert.equal(getHanziStatus(progress["G1-一"], learnedAt + DAY), "known");
  assert.equal(getHanziStatus(progress["G1-一"], learnedAt + 4 * DAY), "review");
});

test("wrong answer sends a known hanzi back to practice", () => {
  const now = Date.UTC(2026, 5, 30);
  const known = {
    "G1-一": {
      attempts: 3,
      correctStreak: 3,
      lastPracticedAt: now,
      nextReviewAt: now + 3 * DAY,
    },
  };

  const progress = recordHanziResult(known, "G1-一", false, now + DAY);

  assert.equal(getHanziStatus(progress["G1-一"], now + DAY), "practice");
});

test("practice selection skips known words but includes due review words", () => {
  const now = Date.UTC(2026, 5, 30);
  const items = [
    { id: "G1-一" },
    { id: "G1-二" },
    { id: "G1-三" },
  ];
  const progress = {
    "G1-一": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now + DAY },
    "G1-二": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now - DAY },
  };

  const selected = selectDueHanzi(items, progress, now);

  assert.deepEqual(selected.map((item) => item.id), ["G1-二", "G1-三"]);
});

test("categorizeHanzi groups practice, known and review ids", () => {
  const now = Date.UTC(2026, 5, 30);
  const items = [
    { id: "G1-一" },
    { id: "G1-二" },
    { id: "G1-三" },
  ];
  const progress = {
    "G1-一": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now + DAY },
    "G1-二": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now - DAY },
  };

  const groups = categorizeHanzi(items, progress, now);

  assert.deepEqual(groups.known.map((item) => item.id), ["G1-一"]);
  assert.deepEqual(groups.review.map((item) => item.id), ["G1-二"]);
  assert.deepEqual(groups.practice.map((item) => item.id), ["G1-三"]);
});

test("challenge generation excludes known words that are not due for review", () => {
  const now = Date.UTC(2026, 5, 30);
  const catalog = [
    makeItem("G1-一", "一"),
    makeItem("G1-二", "二"),
    makeItem("G1-三", "三"),
    makeItem("G1-四", "四"),
    makeItem("G1-五", "五"),
  ];
  const progress = {
    "G1-一": { attempts: 3, correctStreak: 3, lastPracticedAt: now, nextReviewAt: now + DAY },
  };

  const round = generateHanziChallenges(catalog, ["G1"], "G1", 4, () => 0.2, progress, now);

  assert.ok(round.every((challenge) => challenge.answerId !== "G1-一"));
});

function makeItem(id: string, char: string) {
  return {
    id,
    level: "G1" as const,
    char,
    pinyin: char,
    meaning: char,
    words: [`${char}字`, `学习${char}`],
    story: char,
    tags: ["test"],
    groupId: "G1-test",
    groupTitle: "测试组",
    groupPhrase: "一二三四五",
    groupOrder: 0,
    charOrder: 0,
  };
}
