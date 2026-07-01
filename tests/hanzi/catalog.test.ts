import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { HANZI_CATALOG, HANZI_LEVELS } from "../../content/hanzi/catalog.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateHanziChallenges, getHanziForLevel, getHanziForPrimaryGrade, isPrimaryGradeLevel } from "../../content/hanzi/round-core.ts";

test("every hanzi entry has a unique id and required learning fields", () => {
  const ids = HANZI_CATALOG.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate hanzi id detected");

  for (const item of HANZI_CATALOG) {
    assert.ok(HANZI_LEVELS.includes(item.level), `${item.id} has invalid level`);
    assert.equal(item.id, `${item.level}-${item.char}`);
    assert.equal([...item.char].length, 1, `${item.id} must contain one Hanzi char`);
    assert.ok(item.pinyin.length > 0, `${item.id} missing pinyin`);
    assert.ok(item.meaning.length > 0, `${item.id} missing meaning`);
    assert.ok(item.words.length >= 2, `${item.id} should have at least two words`);
    assert.ok(item.story.length > 0, `${item.id} missing child-facing story`);
    assert.ok(item.groupTitle.length > 0, `${item.id} missing memory group title`);
    assert.ok(item.groupPhrase.length > 0, `${item.id} missing memory phrase`);
  }
});

test("primary grade pools grow cumulatively from grade one to grade six", () => {
  const counts = HANZI_LEVELS.map(
    (level) => getHanziForPrimaryGrade(HANZI_CATALOG, HANZI_LEVELS, level).length,
  );
  for (let i = 1; i < counts.length; i++) {
    assert.ok(counts[i] > counts[i - 1], `${HANZI_LEVELS[i]} should add more characters`);
  }
  assert.ok(counts[0] >= 20, "G1 should start with a practical classroom-sized pool");
  assert.ok(counts[5] >= 120, "G6 cumulative pool should cover a broad primary baseline");
});

test("level-only lookup does not leak easier or harder levels", () => {
  for (const level of HANZI_LEVELS) {
    assert.ok(getHanziForLevel(HANZI_CATALOG, level).every((item) => item.level === level));
  }
});

test("recognition challenge generation includes exactly one correct answer", () => {
  const round = generateHanziChallenges(HANZI_CATALOG, HANZI_LEVELS, "G2", 12, () => 0.42);
  assert.equal(round.length, 12);

  for (const challenge of round) {
    assert.ok(isPrimaryGradeLevel(challenge.level, HANZI_LEVELS));
    assert.ok(challenge.choices.some((choice) => choice.id === challenge.answerId));
    assert.equal(
      challenge.choices.filter((choice) => choice.id === challenge.answerId).length,
      1,
      `${challenge.id} should include exactly one answer`,
    );
    assert.equal(new Set(challenge.choices.map((choice) => choice.id)).size, challenge.choices.length);
  }
});

test("catalog preserves memorable group order for numbers, directions and seasons", () => {
  const g1Numbers = HANZI_CATALOG.filter((item) => item.groupTitle === "数字歌").map(
    (item) => item.char,
  );
  const directions = HANZI_CATALOG.filter((item) => item.groupTitle === "方向词").map(
    (item) => item.char,
  );
  const seasons = HANZI_CATALOG.filter((item) => item.groupTitle === "四季轮转").map(
    (item) => item.char,
  );

  assert.deepEqual(g1Numbers, [..."一二三四五六七八九十"]);
  assert.deepEqual(directions, [..."上下左右东西南北"]);
  assert.deepEqual(seasons, [..."春夏秋冬"]);
});
