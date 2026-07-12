import { test } from "node:test";
import assert from "node:assert/strict";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { HANZI_CATALOG, HANZI_LEVELS } from "../../content/hanzi/catalog.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { generateHanziChallenges, getHanziForLevel, getHanziForPrimaryGrade, isPrimaryGradeLevel } from "../../content/hanzi/round-core.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { hanziQuestionSpeechText } from "../../content/hanzi/question-speech.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { PINYIN_FOUNDATIONS } from "../../content/hanzi/pinyin-foundation.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { pinyinSsml } from "../../content/hanzi/pinyin-speech.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { PINYIN_CHART } from "../../content/hanzi/pinyin-chart.ts";

test("every hanzi entry has a unique id and required learning fields", () => {
  const ids = HANZI_CATALOG.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate hanzi id detected");

  for (const item of HANZI_CATALOG) {
    assert.ok(HANZI_LEVELS.includes(item.level), `${item.id} has invalid level`);
    assert.equal(item.id, `hanzi:${item.char}`);
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
  assert.ok(counts[5] >= 590, "G6 cumulative pool should cover the deduplicated practical set");
});

test("catalog does not ship generated placeholder words", () => {
  for (const item of HANZI_CATALOG) {
    assert.notDeepEqual(item.words, [`${item.char}字`, `学习${item.char}`], `${item.char} still uses placeholder words`);
  }
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

test("recognition challenges consistently ask children to find a character", () => {
  const round = generateHanziChallenges(HANZI_CATALOG, HANZI_LEVELS, "G2", 12, () => 0.42);

  assert.ok(round.every((challenge) => String(challenge.mode) !== "char-meaning"));
  assert.ok(round.every((challenge) => challenge.prompt.startsWith("找出")));
});

test("recognition narration includes the prompt and every character option", () => {
  const challenge = generateHanziChallenges(HANZI_CATALOG, HANZI_LEVELS, "G1", 1, () => 0.42)[0];
  const speech = hanziQuestionSpeechText(challenge);

  assert.ok(speech.startsWith(challenge.prompt));
  challenge.choices.forEach((choice, index) => {
    assert.match(speech, new RegExp(`选项 ${String.fromCharCode(65 + index)}，${choice.char}`));
  });
});

test("pinyin foundation starts with simple finals and four tones", () => {
  assert.deepEqual(PINYIN_FOUNDATIONS.map((item) => item.base), ["a", "o", "e", "i", "u", "ü"]);
  assert.deepEqual(PINYIN_FOUNDATIONS[0].tones, ["ā", "á", "ǎ", "à"]);
  assert.deepEqual(PINYIN_FOUNDATIONS.map((item) => item.speech), ["啊", "喔", "鹅", "衣", "乌", "鱼"]);
  assert.ok(PINYIN_FOUNDATIONS.every((item) => !/[a-z]/i.test(item.speech)));
});

test("pinyin SSML pins every final to each real tone", () => {
  assert.equal(pinyinSsml("a", 1), '<speak><phoneme alphabet="py" ph="a1">啊</phoneme></speak>');
  for (const item of PINYIN_FOUNDATIONS) {
    for (const tone of [1, 2, 3, 4] as const) {
      assert.match(pinyinSsml(item.ssmlBase, tone), new RegExp(`ph="${item.ssmlBase}${tone}"`));
    }
  }
});

test("pinyin chart covers initials, finals, nasal finals and whole syllables", () => {
  assert.ok(PINYIN_CHART.length >= 60);
  assert.deepEqual(new Set(PINYIN_CHART.map((item) => item.category)), new Set(["initial", "simple-final", "compound-final", "nasal-final", "whole-syllable"]));
  for (const item of PINYIN_CHART) {
    assert.ok(item.display.length > 0);
    assert.ok(item.mouthHint.length > 0);
    assert.ok(item.exampleChar.length > 0);
    assert.ok(item.exampleWord.length > 0);
    assert.match(item.ssml, /<phoneme alphabet="py" ph="[a-z]+[1-4]">/);
    assert.match(item.lessonSsml, new RegExp(item.mouthHint));
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
