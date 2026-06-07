import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { resolveManagementAccess } from "../../lib/auth/management.ts";

test("redirects unauthenticated visitors to login", () => {
  assert.deepEqual(resolveManagementAccess(null), {
    allowed: false,
    destination: "/login",
  });
});

test("allows parents and admins to open the parent dashboard", () => {
  assert.deepEqual(resolveManagementAccess({ role: "PARENT" }, "parent"), {
    allowed: true,
  });
  assert.deepEqual(resolveManagementAccess({ role: "ADMIN" }, "parent"), {
    allowed: true,
  });
});

test("redirects parents away from the admin dashboard", () => {
  assert.deepEqual(resolveManagementAccess({ role: "PARENT" }, "admin"), {
    allowed: false,
    destination: "/parent",
  });
});

test("allows admins to open the admin dashboard", () => {
  assert.deepEqual(resolveManagementAccess({ role: "ADMIN" }, "admin"), {
    allowed: true,
  });
});

test("rejects unsupported roles from management dashboards", () => {
  assert.deepEqual(resolveManagementAccess({ role: "CHILD" }, "parent"), {
    allowed: false,
    destination: "/login",
  });
  assert.deepEqual(resolveManagementAccess({ role: "CHILD" }, "admin"), {
    allowed: false,
    destination: "/login",
  });
});

for (const area of ["parent", "admin"] as const) {
  test(`${area} layout wires server authorization to its redirect`, () => {
    const source = readFileSync(`app/(management)/${area}/layout.tsx`, "utf8");

    assert.ok(
      source.includes(
        `  const session = await auth();
  const user = session?.user;
  const access = resolveManagementAccess(user, "${area}");

  if (!access.allowed) {
    redirect(access.destination);
  }`,
      ),
      `${area} layout must authorize the server session and redirect denied access`,
    );
  });
}
