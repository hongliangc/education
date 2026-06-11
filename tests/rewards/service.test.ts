import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { fulfillRedemption, recordSessionStars, redeemResource, rejectAndRefundRedemption, type RewardResourceRecord, type RewardsAdapter, type RewardsTransaction, type RedemptionRecord, type StarLedgerRecord } from "../../lib/rewards/service.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { InsufficientStarsError, OutOfStockError } from "../../lib/rewards/errors.ts";

interface FakeState {
  children: Map<string, { id: string; parentId: string; totalStars: number }>;
  resources: Map<string, RewardResourceRecord>;
  redemptions: Map<string, RedemptionRecord>;
  ledgers: Map<string, StarLedgerRecord>;
  operations: string[];
  failNextDebit: boolean;
  concurrentRejectOnNextTransition: boolean;
}

function cloneState(state: FakeState): FakeState {
  return structuredClone(state);
}

class FakeTransaction implements RewardsTransaction {
  private readonly state: FakeState;

  constructor(state: FakeState) {
    this.state = state;
  }

  async findChild(childId: string, ownerId?: string) {
    this.state.operations.push(`child:find:${childId}`);
    const child = this.state.children.get(childId) ?? null;
    return child && (!ownerId || child.parentId === ownerId) ? child : null;
  }

  async findResourceById(resourceId: string) {
    this.state.operations.push(`resource:find:${resourceId}`);
    return this.state.resources.get(resourceId) ?? null;
  }

  async findResourceByScope(
    scopeKey: string,
    resourceType: RewardResourceRecord["resourceType"],
    resourceKey: string,
  ) {
    this.state.operations.push(`resource:scope:${scopeKey}`);
    return (
      [...this.state.resources.values()].find(
        (resource) =>
          resource.scopeKey === scopeKey &&
          resource.resourceType === resourceType &&
          resource.resourceKey === resourceKey &&
          resource.isActive,
      ) ?? null
    );
  }

  async findRedemptionByUnlockKey(unlockKey: string) {
    this.state.operations.push(`redemption:unlock:${unlockKey}`);
    return (
      [...this.state.redemptions.values()].find(
        (redemption) => redemption.unlockKey === unlockKey,
      ) ?? null
    );
  }

  async findRedemptionById(redemptionId: string) {
    this.state.operations.push(`redemption:find:${redemptionId}`);
    return this.state.redemptions.get(redemptionId) ?? null;
  }

  async debitChildIfEnough(childId: string, cost: number, ownerId?: string) {
    this.state.operations.push(`child:debit:${cost}`);
    const child = this.state.children.get(childId);
    if (
      this.state.failNextDebit ||
      !child ||
      (ownerId && child.parentId !== ownerId) ||
      child.totalStars < cost
    ) {
      this.state.failNextDebit = false;
      return false;
    }
    child.totalStars -= cost;
    return true;
  }

  async getChildBalance(childId: string) {
    this.state.operations.push(`child:balance:${childId}`);
    return this.state.children.get(childId)?.totalStars ?? null;
  }

  async decrementStockIfAvailable(resourceId: string) {
    this.state.operations.push(`stock:decrement:${resourceId}`);
    const resource = this.state.resources.get(resourceId);
    if (!resource || resource.stock === null || resource.stock < 1) {
      return resource?.stock === null;
    }
    resource.stock -= 1;
    return true;
  }

  async incrementStock(resourceId: string) {
    this.state.operations.push(`stock:increment:${resourceId}`);
    const resource = this.state.resources.get(resourceId);
    if (resource?.stock !== null && resource) resource.stock += 1;
  }

  async createRedemption(input: Omit<RedemptionRecord, "id">) {
    this.state.operations.push(`redemption:create:${input.status}`);
    if (
      input.unlockKey &&
      [...this.state.redemptions.values()].some(
        (redemption) => redemption.unlockKey === input.unlockKey,
      )
    ) {
      throw new FakeUniqueConflict();
    }
    const redemption = { id: `redemption-${this.state.redemptions.size + 1}`, ...input };
    this.state.redemptions.set(redemption.id, redemption);
    return redemption;
  }

  async transitionRedemption(
    redemptionId: string,
    fromStatus: RedemptionRecord["status"],
    input: Pick<RedemptionRecord, "status" | "fulfilledAt" | "fulfilledById" | "note">,
  ) {
    this.state.operations.push(`redemption:transition:${fromStatus}->${input.status}`);
    const redemption = this.state.redemptions.get(redemptionId);
    if (!redemption || redemption.status !== fromStatus) return null;
    if (
      this.state.concurrentRejectOnNextTransition &&
      input.status === "REJECTED_REFUNDED"
    ) {
      this.state.concurrentRejectOnNextTransition = false;
      redemption.status = "REJECTED_REFUNDED";
      redemption.fulfilledAt = new Date();
      redemption.fulfilledById = "concurrent-fulfiller";
      redemption.note = "concurrent rejection";
      return null;
    }
    Object.assign(redemption, input);
    return redemption;
  }

  async createLedger(input: Omit<StarLedgerRecord, "id">) {
    this.state.operations.push(`ledger:create:${input.reason}:${input.delta}`);
    if (
      input.dedupeKey &&
      [...this.state.ledgers.values()].some((ledger) => ledger.dedupeKey === input.dedupeKey)
    ) {
      throw new FakeUniqueConflict();
    }
    const ledger = { id: `ledger-${this.state.ledgers.size + 1}`, ...input };
    this.state.ledgers.set(ledger.id, ledger);
    return ledger;
  }

  async findLedgerByDedupeKey(dedupeKey: string) {
    this.state.operations.push(`ledger:find:${dedupeKey}`);
    return (
      [...this.state.ledgers.values()].find((ledger) => ledger.dedupeKey === dedupeKey) ??
      null
    );
  }

  async incrementChildStars(childId: string, amount: number) {
    this.state.operations.push(`child:increment:${amount}`);
    const child = this.state.children.get(childId);
    if (!child) return null;
    child.totalStars += amount;
    return child.totalStars;
  }
}

class FakeUniqueConflict extends Error {}

class FakeAdapter implements RewardsAdapter {
  readonly state: FakeState;

  constructor(resources: RewardResourceRecord[], totalStars = 20) {
    this.state = {
      children: new Map([
        ["child-1", { id: "child-1", parentId: "parent-1", totalStars }],
      ]),
      resources: new Map(resources.map((resource) => [resource.id, resource])),
      redemptions: new Map(),
      ledgers: new Map(),
      operations: [],
      failNextDebit: false,
      concurrentRejectOnNextTransition: false,
    };
  }

  async transaction<T>(operation: (tx: RewardsTransaction) => Promise<T>): Promise<T> {
    const snapshot = cloneState(this.state);
    try {
      return await operation(new FakeTransaction(this.state));
    } catch (error) {
      this.state.children = snapshot.children;
      this.state.resources = snapshot.resources;
      this.state.redemptions = snapshot.redemptions;
      this.state.ledgers = snapshot.ledgers;
      this.state.operations = snapshot.operations;
      this.state.failNextDebit = snapshot.failNextDebit;
      this.state.concurrentRejectOnNextTransition =
        snapshot.concurrentRejectOnNextTransition;
      throw error;
    }
  }

  isUniqueConflict(error: unknown): boolean {
    return error instanceof FakeUniqueConflict;
  }
}

function resource(
  overrides: Partial<RewardResourceRecord> = {},
): RewardResourceRecord {
  return {
    id: "platform-resource",
    ownerType: "PLATFORM",
    ownerId: null,
    scopeKey: "PLATFORM",
    resourceType: "VIDEO",
    resourceKey: "stable-video-id",
    starsCost: 5,
    stock: null,
    isActive: true,
    ...overrides,
  };
}

test("insufficient balance rolls back stock and reports the missing stars", async () => {
  const adapter = new FakeAdapter([resource({ stock: 1, starsCost: 8 })], 3);

  await assert.rejects(
    redeemResource({ childId: "child-1", resourceId: "platform-resource", adapter }),
    (error: unknown) =>
      error instanceof InsufficientStarsError && error.needed === 5,
  );

  assert.equal(adapter.state.children.get("child-1")?.totalStars, 3);
  assert.equal(adapter.state.resources.get("platform-resource")?.stock, 1);
  assert.equal(adapter.state.redemptions.size, 0);
  assert.equal(adapter.state.ledgers.size, 0);
});

test("a family zero-cost override creates an unlock without a zero-value ledger", async () => {
  const adapter = new FakeAdapter([
    resource({ starsCost: 10 }),
    resource({
      id: "family-resource",
      ownerType: "FAMILY",
      ownerId: "parent-1",
      scopeKey: "FAMILY:parent-1",
      starsCost: 0,
    }),
  ]);

  const result = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    ownerId: "parent-1",
    adapter,
  });

  assert.equal(result.balance, 20);
  assert.equal(result.redemption.resourceId, "family-resource");
  assert.equal(result.redemption.starsSpent, 0);
  assert.equal(adapter.state.ledgers.size, 0);
});

test("finite inventory is decremented before a paid redemption and cannot oversell", async () => {
  const adapter = new FakeAdapter([resource({ resourceType: "REWARD", stock: 1 })]);

  const result = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  assert.equal(result.redemption.status, "PENDING_FULFILLMENT");
  assert.equal(adapter.state.resources.get("platform-resource")?.stock, 0);
  assert.deepEqual(
    adapter.state.operations.filter((operation) =>
      /stock:decrement|child:debit|redemption:create|ledger:create/.test(operation),
    ),
    [
      "stock:decrement:platform-resource",
      "child:debit:5",
      "redemption:create:PENDING_FULFILLMENT",
      "ledger:create:REDEMPTION:-5",
    ],
  );

  await assert.rejects(
    redeemResource({
      childId: "child-1",
      resourceId: "platform-resource",
      adapter,
    }),
    OutOfStockError,
  );
  assert.equal(adapter.state.children.get("child-1")?.totalStars, 15);
});

test("duplicate permanent unlock returns the existing redemption without charging twice", async () => {
  const adapter = new FakeAdapter([resource()]);
  const first = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  const second = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });

  assert.equal(second.redemption.id, first.redemption.id);
  assert.equal(second.balance, 15);
  assert.equal(adapter.state.redemptions.size, 1);
  assert.equal(adapter.state.ledgers.size, 1);
});

test("reward redemption is repeatable and starts pending fulfillment", async () => {
  const adapter = new FakeAdapter([resource({ resourceType: "REWARD", starsCost: 2 })]);

  const first = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  const second = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });

  assert.equal(first.redemption.status, "PENDING_FULFILLMENT");
  assert.equal(second.redemption.status, "PENDING_FULFILLMENT");
  assert.notEqual(first.redemption.id, second.redemption.id);
  assert.equal(adapter.state.children.get("child-1")?.totalStars, 16);
});

test("fulfillment transitions pending rewards once and is idempotent", async () => {
  const adapter = new FakeAdapter([resource({ resourceType: "REWARD" })]);
  const { redemption } = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });

  await fulfillRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    note: "handed over",
    adapter,
  });
  await fulfillRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    note: "ignored duplicate",
    adapter,
  });

  const stored = adapter.state.redemptions.get(redemption.id);
  assert.equal(stored?.status, "FULFILLED");
  assert.equal(stored?.fulfilledById, "parent-1");
  assert.equal(stored?.note, "handed over");
  assert.equal(
    adapter.state.operations.filter((operation) =>
      operation.startsWith("redemption:transition"),
    ).length,
    1,
  );
});

test("rejection refunds stars and finite stock exactly once", async () => {
  const adapter = new FakeAdapter([
    resource({ resourceType: "REWARD", starsCost: 4, stock: 2 }),
  ]);
  const { redemption } = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });

  const first = await rejectAndRefundRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    note: "unavailable",
    adapter,
  });
  const second = await rejectAndRefundRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    note: "duplicate",
    adapter,
  });

  assert.equal(first.balance, 20);
  assert.equal(second.balance, 20);
  assert.equal(adapter.state.resources.get("platform-resource")?.stock, 2);
  assert.equal(
    [...adapter.state.ledgers.values()].filter((ledger) => ledger.reason === "REFUND")
      .length,
    1,
  );
});

test("duplicate rejection returns the current balance after later star earnings", async () => {
  const adapter = new FakeAdapter([
    resource({ resourceType: "REWARD", starsCost: 4, stock: 2 }),
  ]);
  const { redemption } = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  await rejectAndRefundRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    adapter,
  });
  await recordSessionStars({
    childId: "child-1",
    sessionId: "session-after-refund",
    starsEarned: 3,
    adapter,
  });

  const repeated = await rejectAndRefundRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    adapter,
  });

  assert.equal(repeated.balance, 23);
  assert.equal(adapter.state.resources.get("platform-resource")?.stock, 2);
  assert.equal(
    [...adapter.state.ledgers.values()].filter((ledger) => ledger.reason === "REFUND")
      .length,
    1,
  );
});

test("a concurrent rejection winner is returned without duplicate refund side effects", async () => {
  const adapter = new FakeAdapter([
    resource({ resourceType: "REWARD", starsCost: 4, stock: 2 }),
  ]);
  const { redemption } = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  adapter.state.concurrentRejectOnNextTransition = true;
  const operationsBeforeReject = adapter.state.operations.length;

  const result = await rejectAndRefundRedemption({
    redemptionId: redemption.id,
    fulfillerId: "parent-1",
    adapter,
  });

  assert.equal(result.redemption.status, "REJECTED_REFUNDED");
  assert.equal(result.redemption.fulfilledById, "concurrent-fulfiller");
  assert.equal(result.balance, 16);
  assert.equal(adapter.state.resources.get("platform-resource")?.stock, 1);
  assert.deepEqual(
    adapter.state.operations
      .slice(operationsBeforeReject)
      .filter((operation) =>
        /child:increment|stock:increment|ledger:create/.test(operation),
      ),
    [],
  );
});

test("any chapter can be unlocked directly without the previous one", async () => {
  const adapter = new FakeAdapter([
    resource({
      resourceType: "STORY_CHAPTER",
      resourceKey: "journey:1",
      starsCost: 3,
    }),
  ]);

  // No prior chapter redemption exists; unlocking chapter 1 must still succeed.
  const result = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });
  assert.equal(result.redemption.resourceKey, "journey:1");
});

test("the first chapter is free regardless of configured price", async () => {
  const adapter = new FakeAdapter([
    resource({
      resourceType: "STORY_CHAPTER",
      resourceKey: "journey:0",
      starsCost: 99,
    }),
  ]);

  const result = await redeemResource({
    childId: "child-1",
    resourceId: "platform-resource",
    adapter,
  });

  assert.equal(result.redemption.starsSpent, 0);
  assert.equal(result.balance, 20);
});

test("a failed conditional debit is treated as a concurrent insufficient-balance result", async () => {
  const adapter = new FakeAdapter([resource({ starsCost: 5 })], 20);
  adapter.state.failNextDebit = true;

  await assert.rejects(
    redeemResource({
      childId: "child-1",
      resourceId: "platform-resource",
      adapter,
    }),
    (error: unknown) =>
      error instanceof InsufficientStarsError && error.needed === 0,
  );
  assert.equal(adapter.state.redemptions.size, 0);
});

test("session earning uses the session id as a dedupe key", async () => {
  const adapter = new FakeAdapter([]);

  const first = await recordSessionStars({
    childId: "child-1",
    sessionId: "session-1",
    starsEarned: 7,
    adapter,
  });
  const second = await recordSessionStars({
    childId: "child-1",
    sessionId: "session-1",
    starsEarned: 7,
    adapter,
  });

  assert.equal(first, 27);
  assert.equal(second, 27);
  assert.equal(adapter.state.children.get("child-1")?.totalStars, 27);
  assert.equal(adapter.state.ledgers.size, 1);
  assert.deepEqual(
    adapter.state.operations.filter((operation) =>
      /child:increment|ledger:create/.test(operation),
    ),
    ["child:increment:7", "ledger:create:SESSION_EARN:7"],
  );
});
