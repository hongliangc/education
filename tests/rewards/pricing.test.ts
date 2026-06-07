import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { makeResourceScopeKey, makeUnlockKey, resolveEffectiveCost } from "../../lib/rewards/pricing.ts";

test("family pricing overrides the platform price, including a zero cost", () => {
  assert.equal(
    resolveEffectiveCost({
      platform: 10,
      family: 0,
      firstChapter: false,
    }),
    0,
  );
});

test("platform pricing is used when there is no family override", () => {
  assert.equal(
    resolveEffectiveCost({
      platform: 10,
      family: null,
      firstChapter: false,
    }),
    10,
  );
});

test("the first chapter is always free", () => {
  assert.equal(
    resolveEffectiveCost({
      platform: 10,
      family: 8,
      firstChapter: true,
    }),
    0,
  );
});

test("negative configured prices are rejected", () => {
  assert.throws(
    () =>
      resolveEffectiveCost({
        platform: -1,
        family: null,
        firstChapter: false,
      }),
    /non-negative integer/,
  );
  assert.throws(
    () =>
      resolveEffectiveCost({
        platform: 10,
        family: -1,
        firstChapter: false,
      }),
    /non-negative integer/,
  );
});

test("unlock keys identify a child and stable resource id", () => {
  assert.equal(
    makeUnlockKey("child-1", "STORY_CHAPTER", "book:2"),
    "child-1:STORY_CHAPTER:book:2",
  );
  assert.equal(
    makeUnlockKey("child-1", "VIDEO", "stable-video-id"),
    "child-1:VIDEO:stable-video-id",
  );
});

test("platform resources use one stable non-null scope key", () => {
  assert.equal(makeResourceScopeKey("PLATFORM", null), "PLATFORM");
  assert.equal(makeResourceScopeKey("PLATFORM"), "PLATFORM");
});

test("family resource scope keys isolate different parents", () => {
  assert.equal(makeResourceScopeKey("FAMILY", "parent-1"), "FAMILY:parent-1");
  assert.equal(makeResourceScopeKey("FAMILY", "parent-2"), "FAMILY:parent-2");
  assert.notEqual(
    makeResourceScopeKey("FAMILY", "parent-1"),
    makeResourceScopeKey("FAMILY", "parent-2"),
  );
});

test("resource scope keys reject invalid owner combinations", () => {
  assert.throws(
    () => makeResourceScopeKey("PLATFORM", "parent-1"),
    /PLATFORM resources must not have an ownerId/,
  );
  assert.throws(
    () => makeResourceScopeKey("FAMILY", null),
    /FAMILY resources require a non-empty ownerId/,
  );
  assert.throws(
    () => makeResourceScopeKey("FAMILY", ""),
    /FAMILY resources require a non-empty ownerId/,
  );
});

test("reward resources have a non-null scope key unique selector", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");

  assert.match(schema, /^\s*scopeKey\s+String\s/m);
  assert.match(
    schema,
    /@@unique\(\[scopeKey, resourceType, resourceKey\]\)/,
  );
});
