import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { resolveSelectedMenuKey } from "../../components/management/menuSelection.ts";

const menuItems = [
  { key: "overview", label: "总览", href: "/parent" },
  { key: "rewards", label: "奖励", href: "/parent/rewards" },
  { key: "orders", label: "兑换订单", href: "/parent/rewards/orders" },
];

test("selects the boundary-safe longest matching menu href", () => {
  assert.equal(
    resolveSelectedMenuKey("/parent/rewards/orders/active", menuItems, "overview"),
    "orders",
  );
  assert.equal(resolveSelectedMenuKey("/parent/rewards/history", menuItems, "overview"), "rewards");
  assert.equal(resolveSelectedMenuKey("/parent", menuItems, "fallback"), "overview");
});

test("does not match sibling paths that only share text prefixes", () => {
  assert.equal(
    resolveSelectedMenuKey("/parent/rewardshop", menuItems, "fallback"),
    "overview",
  );
  assert.equal(resolveSelectedMenuKey("/parenting", menuItems, "fallback"), "fallback");
});

test("falls back to the provided selected key when no href matches", () => {
  assert.equal(resolveSelectedMenuKey("/unknown", menuItems, "overview"), "overview");
});

test("management layouts pass their route area explicitly to the shell", () => {
  const parentSource = readFileSync("app/(management)/parent/layout.tsx", "utf8");
  const adminSource = readFileSync("app/(management)/admin/layout.tsx", "utf8");

  assert.match(parentSource, /<ManagementShell\s+area="parent"/);
  assert.match(adminSource, /<ManagementShell\s+area="admin"/);
});

test("management shell derives the active menu from the current pathname", () => {
  const source = readFileSync("components/management/ManagementShell.tsx", "utf8");

  assert.ok(
    source.includes(
      `  const pathname = usePathname();
  const activeMenuKey = resolveSelectedMenuKey(
    pathname,
    menuItems,
    selectedMenuKey,
  );`,
    ),
  );
  assert.match(source, /selectedKeys=\{\[activeMenuKey\]\}/);
  assert.match(
    source,
    /\{area === "admin" \? "平台管理后台" : "家长管理中心"\}/,
  );
});

test("management shell exposes accessible navigation and child return", () => {
  const source = readFileSync("components/management/ManagementShell.tsx", "utf8");

  assert.match(source, /aria-label="管理导航"/);
  assert.match(
    source,
    /aria-current=\{activeMenuKey === item\.key \? "page" : undefined\}/,
  );
  assert.match(source, /href="\/world"/);
});
