// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { InsufficientStarsError, InvalidRedemptionStateError, InvalidRewardInputError, OutOfStockError, RedemptionNotFoundError, RewardAccessDeniedError, RewardResourceUnavailableError } from "./errors.ts";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { makeResourceScopeKey, makeUnlockKey, resolveEffectiveCost } from "./pricing.ts";
import type { RewardOwnerType, RewardRedemptionStatus, RewardResourceType, StarLedgerReason } from "./types.ts";

export interface RewardResourceRecord {
  id: string;
  ownerType: RewardOwnerType;
  ownerId: string | null;
  scopeKey: string;
  resourceType: RewardResourceType;
  resourceKey: string;
  starsCost: number;
  stock: number | null;
  isActive: boolean;
}

export interface RedemptionRecord {
  id: string;
  childId: string;
  resourceId: string;
  resourceType: RewardResourceType;
  resourceKey: string;
  starsSpent: number;
  status: RewardRedemptionStatus;
  unlockKey: string | null;
  fulfilledAt: Date | null;
  fulfilledById: string | null;
  note: string | null;
}

export interface StarLedgerRecord {
  id: string;
  childId: string;
  delta: number;
  balanceAfter: number;
  reason: StarLedgerReason;
  referenceId: string | null;
  dedupeKey: string | null;
}

export interface RewardsTransaction {
  findChild(
    childId: string,
    ownerId?: string,
  ): Promise<{ id: string; parentId: string; totalStars: number } | null>;
  findResourceById(resourceId: string): Promise<RewardResourceRecord | null>;
  findResourceByScope(
    scopeKey: string,
    resourceType: RewardResourceType,
    resourceKey: string,
  ): Promise<RewardResourceRecord | null>;
  findRedemptionByUnlockKey(unlockKey: string): Promise<RedemptionRecord | null>;
  findRedemptionById(
    redemptionId: string,
    ownerId?: string,
  ): Promise<RedemptionRecord | null>;
  debitChildIfEnough(childId: string, cost: number, ownerId?: string): Promise<boolean>;
  getChildBalance(childId: string): Promise<number | null>;
  decrementStockIfAvailable(resourceId: string): Promise<boolean>;
  incrementStock(resourceId: string): Promise<void>;
  createRedemption(input: Omit<RedemptionRecord, "id">): Promise<RedemptionRecord>;
  transitionRedemption(
    redemptionId: string,
    fromStatus: RewardRedemptionStatus,
    input: Pick<
      RedemptionRecord,
      "status" | "fulfilledAt" | "fulfilledById" | "note"
    >,
  ): Promise<RedemptionRecord | null>;
  createLedger(input: Omit<StarLedgerRecord, "id">): Promise<StarLedgerRecord>;
  findLedgerByDedupeKey(dedupeKey: string): Promise<StarLedgerRecord | null>;
  incrementChildStars(childId: string, amount: number): Promise<number | null>;
}

export interface RewardsAdapter {
  transaction<T>(operation: (tx: RewardsTransaction) => Promise<T>): Promise<T>;
  isUniqueConflict(error: unknown): boolean;
}

interface ServiceInput {
  adapter?: RewardsAdapter;
}

export interface RedeemInput extends ServiceInput {
  childId: string;
  resourceId: string;
  ownerId?: string;
}

export interface RedemptionResult {
  redemption: RedemptionRecord;
  balance: number;
}

export interface FulfillInput extends ServiceInput {
  redemptionId: string;
  fulfillerId: string;
  ownerId?: string;
  note?: string;
}

export interface RejectInput extends FulfillInput {}

export interface RefundResult {
  redemption: RedemptionRecord;
  balance: number;
}

export interface SessionStarsInput extends ServiceInput {
  childId: string;
  sessionId: string;
  starsEarned: number;
  ownerId?: string;
}

const PERMANENT_TYPES: ReadonlySet<RewardResourceType> = new Set([
  "STORY_CHAPTER",
  "STORY_TALE",
  "VIDEO",
]);

async function adapterFor(input: ServiceInput): Promise<RewardsAdapter> {
  if (input.adapter) return input.adapter;
  // @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
  const { createPrismaRewardsAdapter } = await import("./adapter.ts");
  return createPrismaRewardsAdapter();
}

function parseChapterKey(resourceKey: string): { bookId: string; chapterIdx: number } {
  const separator = resourceKey.lastIndexOf(":");
  const bookId = resourceKey.slice(0, separator);
  const chapterIdx = Number(resourceKey.slice(separator + 1));
  if (
    separator <= 0 ||
    !bookId ||
    !Number.isInteger(chapterIdx) ||
    chapterIdx < 0
  ) {
    throw new InvalidRewardInputError("invalid story chapter resourceKey");
  }
  return { bookId, chapterIdx };
}

async function currentBalance(tx: RewardsTransaction, childId: string): Promise<number> {
  const balance = await tx.getChildBalance(childId);
  if (balance === null) throw new RewardAccessDeniedError();
  return balance;
}

async function resolveResource(
  tx: RewardsTransaction,
  resourceId: string,
  parentId: string,
): Promise<{ resource: RewardResourceRecord; firstChapter: boolean }> {
  const requested = await tx.findResourceById(resourceId);
  if (!requested?.isActive) throw new RewardResourceUnavailableError();
  if (requested.ownerType === "FAMILY" && requested.ownerId !== parentId) {
    throw new RewardAccessDeniedError();
  }

  const platform = await tx.findResourceByScope(
    makeResourceScopeKey("PLATFORM"),
    requested.resourceType,
    requested.resourceKey,
  );
  const family = await tx.findResourceByScope(
    makeResourceScopeKey("FAMILY", parentId),
    requested.resourceType,
    requested.resourceKey,
  );
  const resource = family ?? platform ?? requested;
  const firstChapter =
    resource.resourceType === "STORY_CHAPTER" &&
    parseChapterKey(resource.resourceKey).chapterIdx === 0;
  const starsCost = resolveEffectiveCost({
    platform: platform?.starsCost ?? requested.starsCost,
    family: family?.starsCost ?? null,
    firstChapter,
  });

  return { resource: { ...resource, starsCost }, firstChapter };
}

async function redeemInTransaction(
  tx: RewardsTransaction,
  input: RedeemInput,
): Promise<RedemptionResult> {
  const child = await tx.findChild(input.childId, input.ownerId);
  if (!child) throw new RewardAccessDeniedError();
  const { resource } = await resolveResource(tx, input.resourceId, child.parentId);
  const permanent = PERMANENT_TYPES.has(resource.resourceType);
  const unlockKey = permanent
    ? makeUnlockKey(input.childId, resource.resourceType, resource.resourceKey)
    : null;

  if (unlockKey) {
    const existing = await tx.findRedemptionByUnlockKey(unlockKey);
    if (existing) {
      return { redemption: existing, balance: await currentBalance(tx, input.childId) };
    }
  }

  if (resource.stock !== null) {
    const reserved = await tx.decrementStockIfAvailable(resource.id);
    if (!reserved) throw new OutOfStockError();
  }

  if (resource.starsCost > 0) {
    const debited = await tx.debitChildIfEnough(
      input.childId,
      resource.starsCost,
      input.ownerId,
    );
    if (!debited) {
      const balance = await currentBalance(tx, input.childId);
      throw new InsufficientStarsError(Math.max(0, resource.starsCost - balance));
    }
  }

  const balance = await currentBalance(tx, input.childId);
  const redemption = await tx.createRedemption({
    childId: input.childId,
    resourceId: resource.id,
    resourceType: resource.resourceType,
    resourceKey: resource.resourceKey,
    starsSpent: resource.starsCost,
    status: resource.resourceType === "REWARD" ? "PENDING_FULFILLMENT" : "COMPLETED",
    unlockKey,
    fulfilledAt: null,
    fulfilledById: null,
    note: null,
  });

  if (resource.starsCost > 0) {
    await tx.createLedger({
      childId: input.childId,
      delta: -resource.starsCost,
      balanceAfter: balance,
      reason: "REDEMPTION",
      referenceId: redemption.id,
      dedupeKey: `redemption:${redemption.id}`,
    });
  }

  return { redemption, balance };
}

export async function redeemResource(input: RedeemInput): Promise<RedemptionResult> {
  const adapter = await adapterFor(input);
  try {
    return await adapter.transaction((tx) => redeemInTransaction(tx, input));
  } catch (error) {
    if (!adapter.isUniqueConflict(error)) throw error;

    return adapter.transaction(async (tx) => {
      const child = await tx.findChild(input.childId, input.ownerId);
      if (!child) throw new RewardAccessDeniedError();
      const { resource } = await resolveResource(tx, input.resourceId, child.parentId);
      if (!PERMANENT_TYPES.has(resource.resourceType)) throw error;
      const unlockKey = makeUnlockKey(
        input.childId,
        resource.resourceType,
        resource.resourceKey,
      );
      const existing = await tx.findRedemptionByUnlockKey(unlockKey);
      if (!existing) throw error;
      return { redemption: existing, balance: await currentBalance(tx, input.childId) };
    });
  }
}

export async function fulfillRedemption(input: FulfillInput): Promise<void> {
  const adapter = await adapterFor(input);
  await adapter.transaction(async (tx) => {
    const redemption = await tx.findRedemptionById(input.redemptionId, input.ownerId);
    if (!redemption) throw new RedemptionNotFoundError();
    if (redemption.status === "FULFILLED") return;
    if (redemption.status !== "PENDING_FULFILLMENT") {
      throw new InvalidRedemptionStateError(redemption.status);
    }

    const updated = await tx.transitionRedemption(
      redemption.id,
      "PENDING_FULFILLMENT",
      {
        status: "FULFILLED",
        fulfilledAt: new Date(),
        fulfilledById: input.fulfillerId,
        note: input.note ?? null,
      },
    );
    if (!updated) {
      const latest = await tx.findRedemptionById(redemption.id, input.ownerId);
      if (latest?.status === "FULFILLED") return;
      throw new InvalidRedemptionStateError(latest?.status ?? "missing");
    }
  });
}

export async function rejectAndRefundRedemption(
  input: RejectInput,
): Promise<RefundResult> {
  const adapter = await adapterFor(input);
  return adapter.transaction(async (tx) => {
    const redemption = await tx.findRedemptionById(input.redemptionId, input.ownerId);
    if (!redemption) throw new RedemptionNotFoundError();
    if (redemption.status === "REJECTED_REFUNDED") {
      return {
        redemption,
        balance: await currentBalance(tx, redemption.childId),
      };
    }
    if (redemption.status !== "PENDING_FULFILLMENT") {
      throw new InvalidRedemptionStateError(redemption.status);
    }

    const updated = await tx.transitionRedemption(
      redemption.id,
      "PENDING_FULFILLMENT",
      {
        status: "REJECTED_REFUNDED",
        fulfilledAt: new Date(),
        fulfilledById: input.fulfillerId,
        note: input.note ?? null,
      },
    );
    if (!updated) {
      const latest = await tx.findRedemptionById(redemption.id, input.ownerId);
      if (latest?.status === "REJECTED_REFUNDED") {
        return {
          redemption: latest,
          balance: await currentBalance(tx, redemption.childId),
        };
      }
      throw new InvalidRedemptionStateError(latest?.status ?? "missing");
    }

    const balance = await tx.incrementChildStars(redemption.childId, redemption.starsSpent);
    if (balance === null) throw new RewardAccessDeniedError();
    const resource = await tx.findResourceById(redemption.resourceId);
    if (resource?.stock !== null && resource) {
      await tx.incrementStock(redemption.resourceId);
    }
    if (redemption.starsSpent > 0) {
      await tx.createLedger({
        childId: redemption.childId,
        delta: redemption.starsSpent,
        balanceAfter: balance,
        reason: "REFUND",
        referenceId: redemption.id,
        dedupeKey: `refund:${redemption.id}`,
      });
    }
    return { redemption: updated, balance };
  });
}

export async function recordSessionStars(input: SessionStarsInput): Promise<number> {
  if (!Number.isInteger(input.starsEarned) || input.starsEarned < 0) {
    throw new InvalidRewardInputError("starsEarned must be a non-negative integer");
  }
  const adapter = await adapterFor(input);
  const dedupeKey = `session:${input.sessionId}`;

  try {
    return await adapter.transaction(async (tx) => {
      const child = await tx.findChild(input.childId, input.ownerId);
      if (!child) throw new RewardAccessDeniedError();
      const existing = await tx.findLedgerByDedupeKey(dedupeKey);
      if (existing) return existing.balanceAfter;

      const balance = await tx.incrementChildStars(input.childId, input.starsEarned);
      if (balance === null) throw new RewardAccessDeniedError();
      await tx.createLedger({
        childId: input.childId,
        delta: input.starsEarned,
        balanceAfter: balance,
        reason: "SESSION_EARN",
        referenceId: input.sessionId,
        dedupeKey,
      });
      return balance;
    });
  } catch (error) {
    if (!adapter.isUniqueConflict(error)) throw error;
    return adapter.transaction(async (tx) => {
      const ledger = await tx.findLedgerByDedupeKey(dedupeKey);
      if (!ledger) throw error;
      return ledger.balanceAfter;
    });
  }
}
