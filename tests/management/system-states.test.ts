import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("management error offers retry, safe return, and conditional digest", () => {
  const source = readFileSync("app/(management)/error.tsx", "utf8");

  assert.match(source, /"use client"/);
  assert.match(source, /role="alert"/);
  assert.match(source, /unstable_retry\(\)/);
  assert.match(source, /href="\/"/);
  assert.match(source, /error\.digest \?/);
  assert.doesNotMatch(source, /error\.message/);
});

test("management loading and root 404 expose readable status exits", () => {
  const loading = readFileSync("app/(management)/loading.tsx", "utf8");
  const notFound = readFileSync("app/not-found.tsx", "utf8");

  assert.match(loading, /role="status"/);
  assert.match(loading, /正在加载/);
  assert.match(notFound, /页面不存在/);
  assert.match(notFound, /href="\/"/);
});
