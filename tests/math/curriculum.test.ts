import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { getMathCurriculum } from "../../content/math/curriculum.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { GRADES, type Grade } from "../../lib/grades.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { sceneForProblem } from "../../content/math/scene.ts";

const MIN_LESSONS: Record<Grade, number> = { K1: 4, K2: 4, K3: 4, G1: 5, G2: 5, G3: 5 };

test("every grade exposes an ordered, uniquely-keyed guided path", () => {
  for (const grade of GRADES) {
    const lessons = getMathCurriculum(grade);
    assert.ok(
      lessons && lessons.length >= MIN_LESSONS[grade],
      `${grade} should have at least ${MIN_LESSONS[grade]} lessons`,
    );
    const keys = new Set(lessons.map((l) => l.key));
    assert.equal(keys.size, lessons.length, `${grade} lesson keys must be unique`);
    const orders = lessons.map((l) => l.order);
    for (let i = 1; i < orders.length; i++) {
      assert.ok(orders[i] > orders[i - 1], `${grade} orders must strictly increase`);
    }
    for (const lesson of lessons) {
      assert.ok(lesson.concept.length > 0, `${lesson.key} needs a concept line`);
    }
  }
});

test("lesson keys are globally unique across grades", () => {
  const all = GRADES.flatMap((g) => getMathCurriculum(g)!.map((l) => l.key));
  assert.equal(new Set(all).size, all.length, "every lesson key must be unique across grades");
});

test("each lesson generates the requested count of in-grade problems", () => {
  for (const grade of GRADES) {
    for (const lesson of getMathCurriculum(grade)!) {
      const problems = lesson.generate(4);
      assert.equal(problems.length, 4, `${lesson.key} should yield 4 problems`);
      for (const p of problems) assert.equal(p.grade, grade, `${lesson.key} wrong grade`);
    }
  }
});

test("G1 within-20 arithmetic always crosses ten and stays animatable", () => {
  const add = getMathCurriculum("G1")!.find((l) => l.key === "g1-add-within-20")!;
  const sub = getMathCurriculum("G1")!.find((l) => l.key === "g1-sub-within-20")!;
  for (const p of add.generate(50)) {
    assert.equal(p.kind, "arithmetic");
    if (p.kind !== "arithmetic") continue;
    const [a, b] = p.operands;
    assert.ok(a <= 9 && b <= 9 && a + b >= 11 && a + b <= 18, p.prompt);
    assert.equal(sceneForProblem(p)?.kind, "make-ten-add");
  }
  for (const p of sub.generate(50)) {
    assert.equal(p.kind, "arithmetic");
    if (p.kind !== "arithmetic") continue;
    const [a, b] = p.operands;
    assert.ok(a >= 11 && a <= 18 && a - 10 < b && a - b >= 1, p.prompt);
    assert.equal(sceneForProblem(p)?.kind, "break-ten-sub");
  }
});

test("G3 splits multiplication and division into focused lessons", () => {
  const g3 = getMathCurriculum("G3")!;
  const mul = g3.find((l) => l.key === "g3-multiply")!;
  const div = g3.find((l) => l.key === "g3-divide")!;
  assert.ok(mul && div, "G3 needs g3-multiply and g3-divide lessons");
  for (const p of mul.generate(10)) {
    assert.equal(p.kind, "arithmetic");
    if (p.kind === "arithmetic") assert.equal(p.op, "×");
  }
  for (const p of div.generate(10)) {
    assert.equal(p.kind, "arithmetic");
    if (p.kind === "arithmetic") {
      assert.equal(p.op, "÷");
      assert.equal(p.operands[0] % p.operands[1], 0, "division must be exact");
    }
  }
});

test("lessons in the three supported arithmetic bands only generate animatable problems", () => {
  const lessonKeys = [
    "k1-add-5",
    "k1-sub-5",
    "k2-add-10",
    "k2-sub-10",
    "k3-add-10",
    "k3-sub-10",
    "g1-add-within-20",
    "g1-sub-within-20",
    "g2-multiply",
    "g3-multiply",
    "g3-divide",
  ];

  const lessons = GRADES.flatMap((grade) => getMathCurriculum(grade)!).filter((lesson) =>
    lessonKeys.includes(lesson.key),
  );
  assert.equal(lessons.length, lessonKeys.length);

  for (const lesson of lessons) {
    for (const problem of lesson.generate(100)) {
      assert.ok(sceneForProblem(problem), `${lesson.key} generated ${problem.prompt}`);
    }
  }
});
