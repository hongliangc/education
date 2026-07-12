import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { compareEpisodes, episodeNumber } from "../../lib/video/episode-order.ts";

test("episodeNumber parses the common collection markers", () => {
  assert.equal(episodeNumber("兔小贝成语故事 第04集"), 4);
  assert.equal(episodeNumber("小猪佩奇 第13集"), 13);
  assert.equal(episodeNumber("某动画 第2话"), 2);
  assert.equal(episodeNumber("The Green Planet S01E02"), 1002);
  assert.equal(episodeNumber("The Green Planet S02E01"), 2001);
  assert.equal(episodeNumber("Show EP12"), 12);
  assert.equal(episodeNumber("81.仙履奇缘国语"), 81);
  assert.equal(episodeNumber("01桃园三结义"), 1);
  assert.equal(episodeNumber("20孙策之死"), 20);
});

test("episodeNumber returns null for movies and bare years", () => {
  assert.equal(episodeNumber("冰雪奇缘"), null);
  assert.equal(episodeNumber("The Boy and the Heron 2023"), null);
  assert.equal(episodeNumber("2023电影"), null);
});

test("compareEpisodes sorts a collection ascending, numbered before un-numbered", () => {
  const titles = ["第10集", "第2集", "第1集", "片头曲"];
  titles.sort(compareEpisodes);
  assert.deepEqual(titles, ["第1集", "第2集", "第10集", "片头曲"]);
});

test("compareEpisodes orders multi-season episodes season-major", () => {
  const titles = ["Planet S02E01", "Planet S01E02", "Planet S01E10"];
  titles.sort(compareEpisodes);
  assert.deepEqual(titles, ["Planet S01E02", "Planet S01E10", "Planet S02E01"]);
});
