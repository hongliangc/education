import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { filterVideos, pickFeatured } from "../../lib/video/search.ts";

const videos = [
  { title: "动画电影", categoryTitle: "动画", searchKey: "donghuadianying dhdy" },
  { title: "WOW English Lesson 1", categoryTitle: "英语", searchKey: "wow english lesson yel" },
  { title: "完美星球", categoryTitle: "纪录片", subject: "科普", searchKey: "wanmeixingqiu wmxq" },
];

test("filterVideos matches Chinese substrings in the title", () => {
  assert.deepEqual(filterVideos(videos, "电影").map((v) => v.title), ["动画电影"]);
});

test("filterVideos matches pinyin full and initials via searchKey", () => {
  assert.deepEqual(filterVideos(videos, "dhdy").map((v) => v.title), ["动画电影"]);
  assert.deepEqual(filterVideos(videos, "wanmei").map((v) => v.title), ["完美星球"]);
});

test("filterVideos is case-insensitive and matches English + subject", () => {
  assert.deepEqual(filterVideos(videos, "wow").map((v) => v.title), ["WOW English Lesson 1"]);
  assert.deepEqual(filterVideos(videos, "科普").map((v) => v.title), ["完美星球"]);
});

test("filterVideos returns a copy of all videos for an empty query", () => {
  const result = filterVideos(videos, "   ");
  assert.equal(result.length, videos.length);
  assert.notEqual(result, videos);
});

test("pickFeatured prefers an unlocked video that has a poster", () => {
  const items = [
    { posterUrl: undefined, unlocked: true },
    { posterUrl: "/a", unlocked: false },
    { posterUrl: "/b", unlocked: true },
  ];
  assert.equal(pickFeatured(items), items[2]);
});

test("pickFeatured falls back to any poster, then the first item", () => {
  assert.equal(pickFeatured([{ posterUrl: undefined }, { posterUrl: "/x" }])?.posterUrl, "/x");
  const noPosters = [{ posterUrl: undefined }, { posterUrl: undefined }];
  assert.equal(pickFeatured(noPosters), noPosters[0]);
  assert.equal(pickFeatured([]), undefined);
});
