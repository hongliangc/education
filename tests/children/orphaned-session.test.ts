import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routeSource = readFileSync("app/api/children/route.ts", "utf8");
const pageSource = readFileSync("app/(game)/child-select/page.tsx", "utf8");

test("child create rejects an orphaned session with 401 before touching the FK", () => {
  // Verify the parent still exists in the DB (JWT cookie alone is not enough).
  assert.match(routeSource, /prisma\.user\.findUnique/);
  assert.match(routeSource, /登录已失效，请重新登录/);
  assert.match(routeSource, /status:\s*401/);

  // The existence guard must run before prisma.child.create, otherwise the FK
  // violation (P2003) still surfaces as an opaque 500.
  const guardIdx = routeSource.indexOf("prisma.user.findUnique");
  const createIdx = routeSource.indexOf("prisma.child.create");
  assert.ok(guardIdx !== -1 && createIdx !== -1);
  assert.ok(guardIdx < createIdx, "parent existence check must precede child.create");
});

test("child-select clears the stale session on a 401 instead of showing 创建失败", () => {
  assert.match(pageSource, /res\.status === 401/);
  assert.match(pageSource, /signOut\(\{ callbackUrl: "\/login" \}\)/);
});
