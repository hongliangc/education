import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { MODULES, MODULE_META } from "../../lib/utils.ts";

test("HISTORY 模块已注册并带中文标签", () => {
  assert.ok((MODULES as readonly string[]).includes("HISTORY"));
  assert.equal(MODULE_META.HISTORY.label, "上下五千年");
});

test("world 地图把 HISTORY 路由到 /history 且有 SVG 节点", () => {
  const src = readFileSync("app/(game)/world/page.tsx", "utf8");
  assert.match(src, /HISTORY:\s*"\/history"/);
  assert.match(src, /id:\s*"HISTORY"/);
});
