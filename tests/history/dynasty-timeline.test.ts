import assert from "node:assert/strict";
import test from "node:test";
import { existsSync } from "node:fs";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { DYNASTY_TIMELINE } from "../../content/history/dynastyTimeline.ts";

const items = DYNASTY_TIMELINE.flatMap((g) => g.items);

test("历史长卷覆盖远古到近现代，且仅三国 active", () => {
  assert.ok(DYNASTY_TIMELINE.length >= 8, "至少 8 个时代分组");
  const active = items.filter((d) => d.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, "three-kingdoms");
  assert.equal(active[0].href, "/history/three-kingdoms");
});

test("朝代 id 唯一，未开放朝代无 href", () => {
  const ids = items.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length, "id 唯一");
  for (const d of items) {
    if (!d.active) assert.equal(d.href, undefined, `${d.name} 未开放不应有 href`);
  }
});

test("每个朝代封面 webp 实际存在于 public", () => {
  for (const d of items) {
    assert.ok(d.cover, `${d.name} 缺少封面路径`);
    const path = `public${d.cover}`;
    assert.ok(existsSync(path), `缺少封面文件 ${path}`);
  }
});
