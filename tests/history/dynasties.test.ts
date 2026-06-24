import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { DYNASTIES } from "../../content/history/dynasties.ts";

test("朝代条覆盖远古到近现代，且仅三国 active", () => {
  assert.ok(DYNASTIES.length >= 8, "至少 8 个朝代段");
  const active = DYNASTIES.filter((d) => d.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].key, "three-kingdoms");
  const keys = DYNASTIES.map((d) => d.key);
  assert.equal(new Set(keys).size, keys.length, "key 唯一");
});
