import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_CATALOG } from "../../content/hanzi/catalog.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { HANZI_UNITS, getHanziUnit, getUnitsForStage } from "../../content/hanzi/curriculum.ts";
// @ts-expect-error Node's native TypeScript tests require the explicit extension.
import { getHanziDomainAdapter } from "../../content/hanzi/domain-adapter.ts";

test("every catalog character has one purposeful curriculum unit", () => {
  const assigned = new Map<string, string>();
  for (const unit of HANZI_UNITS) {
    assert.ok(unit.objective.startsWith("能够"), `${unit.id} needs an observable objective`);
    assert.doesNotMatch(unit.title, /生活常用字\s*\d/);
    assert.ok(unit.recognizeChars.length > 0, `${unit.id} is empty`);
    assert.ok(unit.writeChars.every((char) => unit.recognizeChars.includes(char)));
    assert.deepEqual(new Set(unit.teachingOrder), new Set(unit.recognizeChars));
    for (const char of unit.recognizeChars) {
      assert.equal(assigned.has(char), false, `duplicate primary unit for ${char}`);
      assigned.set(char, unit.id);
    }
  }

  for (const char of new Set(HANZI_CATALOG.map((item) => item.char))) {
    assert.ok(assigned.has(char), `missing unit for ${char}`);
  }
});

test("unit prerequisites and stage queries are valid", () => {
  const ids = new Set(HANZI_UNITS.map((unit) => unit.id));
  for (const unit of HANZI_UNITS) {
    assert.ok(unit.prerequisiteUnitIds.every((id) => ids.has(id)), `${unit.id} has unknown prerequisite`);
  }
  assert.ok(getUnitsForStage("foundation").every((unit) => unit.stage === "foundation"));
});

test("concrete introductory concepts are placed before abstract reading content", () => {
  assert.equal(getHanziUnit("天")?.id, "discover-weather");
  assert.equal(getHanziUnit("东")?.id, "find-directions");
  assert.equal(getHanziUnit("重")?.stage, "reading");
});

test("child domain adapter limits new content by learner band", () => {
  assert.deepEqual(getHanziDomainAdapter("K2"), {
    learnerBand: "early",
    maxMinutes: 5,
    maxNewItems: 1,
    inputModalities: ["visual", "audio", "touch"],
    explanationEvidence: ["teach-sprite", "point", "sort"],
  });
  assert.equal(getHanziDomainAdapter("G1").maxNewItems, 3);
  assert.equal(getHanziDomainAdapter("G3").maxNewItems, 4);
});
