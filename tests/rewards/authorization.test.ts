import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { canAccessChild, canManageResource, manageScopeFor, redemptionScopeOwnerId, resolveRewardActor } from "../../lib/rewards/authorization.ts";

test("resolveRewardActor accepts only PARENT and ADMIN with an id", () => {
  assert.equal(resolveRewardActor(null), null);
  assert.equal(resolveRewardActor({ role: "PARENT" }), null);
  assert.equal(resolveRewardActor({ id: "u1", role: "CHILD" }), null);
  assert.deepEqual(resolveRewardActor({ id: "u1", role: "PARENT" }), { id: "u1", role: "PARENT" });
  assert.deepEqual(resolveRewardActor({ id: "a1", role: "ADMIN" }), { id: "a1", role: "ADMIN" });
});

test("parents manage only their own family scope; admins manage platform", () => {
  const parent = { id: "p1", role: "PARENT" } as const;
  const admin = { id: "a1", role: "ADMIN" } as const;

  assert.deepEqual(manageScopeFor(parent), { ownerType: "FAMILY", ownerId: "p1" });
  assert.deepEqual(manageScopeFor(admin), { ownerType: "PLATFORM", ownerId: null });

  assert.equal(canManageResource(parent, { ownerType: "FAMILY", ownerId: "p1" }), true);
  assert.equal(canManageResource(parent, { ownerType: "FAMILY", ownerId: "p2" }), false);
  assert.equal(canManageResource(parent, { ownerType: "PLATFORM", ownerId: null }), false);
  assert.equal(canManageResource(admin, { ownerType: "PLATFORM", ownerId: null }), true);
  assert.equal(canManageResource(admin, { ownerType: "FAMILY", ownerId: "p1" }), false);
});

test("child-scoped access: parents reach only their children, admins reach any", () => {
  const parent = { id: "p1", role: "PARENT" } as const;
  const admin = { id: "a1", role: "ADMIN" } as const;

  assert.equal(canAccessChild(parent, "p1"), true);
  assert.equal(canAccessChild(parent, "p2"), false);
  assert.equal(canAccessChild(admin, "p2"), true);

  assert.equal(redemptionScopeOwnerId(parent), "p1");
  assert.equal(redemptionScopeOwnerId(admin), undefined);
});
