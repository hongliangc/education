import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const catalogSource = readFileSync("lib/video/catalog.ts", "utf8");
const schemaSource = readFileSync("prisma/schema.prisma", "utf8");

test("video catalog cache is persisted as a string payload", () => {
  assert.match(schemaSource, /model VideoCatalogCache \{/);
  assert.match(schemaSource, /id\s+String\s+@id\s+@default\("default"\)/);
  assert.match(schemaSource, /payload\s+String/);
});

test("video catalog uses DB seed and stale-while-revalidate refresh", () => {
  assert.match(catalogSource, /prisma\.videoCatalogCache\.findUnique/);
  assert.match(catalogSource, /prisma\.videoCatalogCache\.upsert/);
  assert.match(catalogSource, /function refreshCatalogInBackground\(\): void/);
  assert.match(catalogSource, /return cachedCatalog\.entries/);
});
