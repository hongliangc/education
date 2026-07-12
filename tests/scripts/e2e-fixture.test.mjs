import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ensureE2eFixture,
  readE2eFixtureConfig,
} from "../../scripts/ensure-e2e-fixture.mjs";

test("E2E fixture refuses to run in production", () => {
  assert.throws(
    () => readE2eFixtureConfig({ NODE_ENV: "production" }),
    /production/,
  );
});

test("E2E fixture requires private credentials", () => {
  assert.throws(
    () => readE2eFixtureConfig({ NODE_ENV: "test" }),
    /E2E_PARENT_EMAIL.*E2E_PARENT_PASSWORD/,
  );
});

test("E2E fixture reuses the parent and child on repeated runs", async () => {
  const state = { parent: null, child: null };
  const adapter = {
    async upsertParent(input) {
      state.parent = { id: "parent-1", ...input };
      return state.parent;
    },
    async upsertChild(input) {
      state.child = state.child ?? { id: "child-1", ...input };
      return state.child;
    },
  };
  const config = {
    parentEmail: "e2e@example.test",
    parentPassword: "private-password",
    childName: "验收小朋友",
    childAge: 7,
    childGradeLevel: "G1",
  };

  const first = await ensureE2eFixture(config, adapter);
  const second = await ensureE2eFixture(config, adapter);

  assert.equal(first.parentId, "parent-1");
  assert.equal(first.childId, "child-1");
  assert.deepEqual(second, first);
});
