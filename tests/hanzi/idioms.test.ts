import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { HANZI_IDIOMS, getIdiomForHanzi } from "../../content/hanzi/idioms.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { selectNextIdiom } from "../../content/hanzi/idiom-scheduler.ts";

test("idiom catalog ships child-facing complete lessons", () => {
  assert.ok(HANZI_IDIOMS.length >= 60);
  for (const item of HANZI_IDIOMS) {
    assert.ok(item.id.length > 0);
    assert.ok(item.idiom.length >= 4);
    assert.ok(item.pinyin.length > 0);
    assert.ok(item.meaning.length > 0);
    assert.ok(item.origin.length > 0);
    assert.ok(item.story.length >= 40 && item.story.length <= 220);
    assert.ok(item.example.length > 0);
    assert.ok(item.keyChars.length > 0);
    assert.ok(item.quiz.length >= 3);
  }
});

test("idiom lookup finds lessons by key character", () => {
  const lesson = getIdiomForHanzi("画");

  assert.equal(lesson?.idiom, "画龙点睛");
  assert.ok(lesson?.keyChars.includes("画"));
});

test("idiom scheduler avoids the previous item and deprioritizes mastered content", () => {
  const now = Date.UTC(2026, 6, 11);
  const mastered = {
    [HANZI_IDIOMS[0].id]: { status: "used" as const, attempts: 3, correctStreak: 3, explainCount: 1, reviewLevel: 1, lastPracticedAt: now, nextReviewAt: now + 86_400_000 },
  };
  const next = selectNextIdiom(HANZI_IDIOMS, mastered, HANZI_IDIOMS[1].id, () => 0, now);

  assert.notEqual(next?.id, HANZI_IDIOMS[0].id);
  assert.notEqual(next?.id, HANZI_IDIOMS[1].id);
});
