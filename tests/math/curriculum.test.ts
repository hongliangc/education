import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { getMathCurriculum } from "../../content/math/curriculum.ts";

test("G1 exposes an ordered guided path; other grades fall back to null", () => {
  const g1 = getMathCurriculum("G1");
  assert.ok(g1 && g1.length >= 5, "G1 should have at least five lessons");
  assert.equal(getMathCurriculum("K1"), null);
  assert.equal(getMathCurriculum("G3"), null);
});

test("lessons are uniquely keyed and strictly ordered", () => {
  const lessons = getMathCurriculum("G1")!;
  const keys = new Set(lessons.map((l) => l.key));
  assert.equal(keys.size, lessons.length, "lesson keys must be unique");
  const orders = lessons.map((l) => l.order);
  for (let i = 1; i < orders.length; i++) {
    assert.ok(orders[i] > orders[i - 1], "orders must strictly increase");
  }
  for (const lesson of lessons) {
    assert.ok(lesson.concept.length > 0, `${lesson.key} needs a concept line`);
  }
});

test("each lesson generates the requested count of in-scope problems", () => {
  const lessons = getMathCurriculum("G1")!;
  const expectedKind: Record<string, string> = {
    "g1-add-within-20": "arithmetic",
    "g1-sub-within-20": "arithmetic",
    "g1-compare-100": "comparison",
    "g1-clock": "time",
    "g1-shapes": "shape",
  };
  for (const lesson of lessons) {
    const problems = lesson.generate(4);
    assert.equal(problems.length, 4, `${lesson.key} should yield 4 problems`);
    for (const p of problems) {
      assert.equal(p.kind, expectedKind[lesson.key], `${lesson.key} wrong kind`);
      assert.equal(p.grade, "G1");
    }
  }
});

test("within-20 arithmetic stays inside its range", () => {
  const add = getMathCurriculum("G1")!.find((l) => l.key === "g1-add-within-20")!;
  const sub = getMathCurriculum("G1")!.find((l) => l.key === "g1-sub-within-20")!;
  for (const p of add.generate(20)) assert.ok(Number(p.answer) <= 20 && Number(p.answer) >= 0);
  for (const p of sub.generate(20)) assert.ok(Number(p.answer) <= 20 && Number(p.answer) >= 0);
});
