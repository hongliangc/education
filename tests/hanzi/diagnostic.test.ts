import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { buildHanziDiagnostic, resolveHanziStartingUnit } from "../../content/hanzi/diagnostic.ts";

test("diagnostic samples missing evidence without teaching", () => {
  const tasks = buildHanziDiagnostic({}, "K3");
  assert.ok(tasks.length > 0 && tasks.length <= 6);
  assert.ok(tasks.every((task) => task.teaches === false));
  assert.ok(tasks.every((task) => task.unitId && task.hanziId.startsWith("hanzi:")));
});

test("starting unit is the earliest unit that is not fully known", () => {
  const progress = Object.fromEntries(
    [..."一二三四五六七八九十零两百千万个只半"].map((char) => [
      `hanzi:${char}`,
      { attempts: 3, correctStreak: 3, lastPracticedAt: 10, nextReviewAt: 1000 },
    ]),
  );
  assert.equal(resolveHanziStartingUnit(progress, 100).id, "know-myself");
});
