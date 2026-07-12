import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { getIdiomStatus, recordIdiomAnswer, recordIdiomExplanation, recordIdiomResult } from "../../content/hanzi/idiom-progress.ts";

const DAY = 24 * 60 * 60 * 1000;

test("new idiom progresses from learned to explained to used", () => {
  const now = Date.UTC(2026, 6, 10);
  const learned = recordIdiomResult({}, "hua-long-dian-jing", "learned", now);
  const explained = recordIdiomResult(learned, "hua-long-dian-jing", "explained", now + DAY);
  const used = recordIdiomResult(explained, "hua-long-dian-jing", "used", now + 2 * DAY);

  assert.equal(getIdiomStatus(learned["hua-long-dian-jing"], now), "learned");
  assert.equal(getIdiomStatus(explained["hua-long-dian-jing"], now + DAY), "explained");
  assert.equal(getIdiomStatus(used["hua-long-dian-jing"], now + 2 * DAY), "used");
});

test("used idiom returns to review after nextReviewAt", () => {
  const now = Date.UTC(2026, 6, 10);
  const progress = recordIdiomResult({}, "hua-long-dian-jing", "used", now);

  assert.equal(getIdiomStatus(progress["hua-long-dian-jing"], now + DAY), "used");
  assert.equal(getIdiomStatus(progress["hua-long-dian-jing"], now + 8 * DAY), "review");
});

test("idiom explanation and answers drive Feynman mastery", () => {
  const now = Date.UTC(2026, 6, 11);
  const explained = recordIdiomExplanation({}, "yi-ye-zhi-qiu", now);
  const correct = recordIdiomAnswer(explained, "yi-ye-zhi-qiu", true, now);
  const wrong = recordIdiomAnswer(correct, "yi-ye-zhi-qiu", false, now + DAY);

  assert.equal(explained["yi-ye-zhi-qiu"].explainCount, 1);
  assert.equal(correct["yi-ye-zhi-qiu"].correctStreak, 1);
  assert.equal(wrong["yi-ye-zhi-qiu"].correctStreak, 0);
});
