import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma } from "../db";
import type {
  RewardResourceRecord,
  RewardsAdapter,
  RewardsTransaction,
  RedemptionRecord,
  StarLedgerRecord,
} from "./service";

type PrismaExecutor = Prisma.TransactionClient | PrismaClient;

function toResourceRecord(resource: {
  id: string;
  ownerType: string;
  ownerId: string | null;
  scopeKey: string;
  resourceType: string;
  resourceKey: string;
  starsCost: number;
  stock: number | null;
  isActive: boolean;
}): RewardResourceRecord {
  return resource as RewardResourceRecord;
}

function toRedemptionRecord(redemption: {
  id: string;
  childId: string;
  resourceId: string;
  starsSpent: number;
  status: string;
  unlockKey: string | null;
  fulfilledAt: Date | null;
  fulfilledById: string | null;
  note: string | null;
  resource: {
    resourceType: string;
    resourceKey: string;
  };
}): RedemptionRecord {
  return {
    id: redemption.id,
    childId: redemption.childId,
    resourceId: redemption.resourceId,
    resourceType: redemption.resource.resourceType as RedemptionRecord["resourceType"],
    resourceKey: redemption.resource.resourceKey,
    starsSpent: redemption.starsSpent,
    status: redemption.status as RedemptionRecord["status"],
    unlockKey: redemption.unlockKey,
    fulfilledAt: redemption.fulfilledAt,
    fulfilledById: redemption.fulfilledById,
    note: redemption.note,
  };
}

function createTransaction(executor: PrismaExecutor): RewardsTransaction {
  return {
    async findChild(childId, ownerId) {
      return executor.child.findFirst({
        where: { id: childId, ...(ownerId ? { parentId: ownerId } : {}) },
        select: { id: true, parentId: true, totalStars: true },
      });
    },

    async findResourceById(resourceId) {
      const resource = await executor.rewardResource.findUnique({ where: { id: resourceId } });
      return resource ? toResourceRecord(resource) : null;
    },

    async findResourceByScope(scopeKey, resourceType, resourceKey) {
      const resource = await executor.rewardResource.findUnique({
        where: {
          scopeKey_resourceType_resourceKey: { scopeKey, resourceType, resourceKey },
        },
      });
      return resource?.isActive ? toResourceRecord(resource) : null;
    },

    async findRedemptionByUnlockKey(unlockKey) {
      const redemption = await executor.rewardRedemption.findUnique({
        where: { unlockKey },
        include: { resource: { select: { resourceType: true, resourceKey: true } } },
      });
      return redemption ? toRedemptionRecord(redemption) : null;
    },

    async findRedemptionById(redemptionId, ownerId) {
      const redemption = await executor.rewardRedemption.findFirst({
        where: {
          id: redemptionId,
          ...(ownerId ? { child: { parentId: ownerId } } : {}),
        },
        include: { resource: { select: { resourceType: true, resourceKey: true } } },
      });
      return redemption ? toRedemptionRecord(redemption) : null;
    },

    async debitChildIfEnough(childId, cost, ownerId) {
      const updated = await executor.child.updateMany({
        where: {
          id: childId,
          ...(ownerId ? { parentId: ownerId } : {}),
          totalStars: { gte: cost },
        },
        data: { totalStars: { decrement: cost } },
      });
      return updated.count === 1;
    },

    async getChildBalance(childId) {
      const child = await executor.child.findUnique({
        where: { id: childId },
        select: { totalStars: true },
      });
      return child?.totalStars ?? null;
    },

    async decrementStockIfAvailable(resourceId) {
      const updated = await executor.rewardResource.updateMany({
        where: { id: resourceId, stock: { gte: 1 } },
        data: { stock: { decrement: 1 } },
      });
      return updated.count === 1;
    },

    async incrementStock(resourceId) {
      await executor.rewardResource.update({
        where: { id: resourceId },
        data: { stock: { increment: 1 } },
      });
    },

    async createRedemption(input) {
      const redemption = await executor.rewardRedemption.create({
        data: {
          childId: input.childId,
          resourceId: input.resourceId,
          starsSpent: input.starsSpent,
          status: input.status,
          unlockKey: input.unlockKey,
          fulfilledAt: input.fulfilledAt,
          fulfilledById: input.fulfilledById,
          note: input.note,
        },
        include: { resource: { select: { resourceType: true, resourceKey: true } } },
      });
      return toRedemptionRecord(redemption);
    },

    async transitionRedemption(redemptionId, fromStatus, input) {
      const updated = await executor.rewardRedemption.updateMany({
        where: { id: redemptionId, status: fromStatus },
        data: input,
      });
      if (updated.count !== 1) return null;
      const redemption = await executor.rewardRedemption.findUniqueOrThrow({
        where: { id: redemptionId },
        include: { resource: { select: { resourceType: true, resourceKey: true } } },
      });
      return toRedemptionRecord(redemption);
    },

    async createLedger(input) {
      return executor.starLedger.create({ data: input }) as Promise<StarLedgerRecord>;
    },

    async findLedgerByDedupeKey(dedupeKey) {
      return executor.starLedger.findUnique({ where: { dedupeKey } }) as Promise<
        StarLedgerRecord | null
      >;
    },

    async incrementChildStars(childId, amount) {
      const child = await executor.child.update({
        where: { id: childId },
        data: { totalStars: { increment: amount } },
        select: { totalStars: true },
      });
      return child.totalStars;
    },
  };
}

export function createPrismaRewardsAdapter(
  transactionClient?: Prisma.TransactionClient,
): RewardsAdapter {
  if (transactionClient) {
    return {
      transaction: async (operation) => operation(createTransaction(transactionClient)),
      isUniqueConflict,
    };
  }

  return {
    transaction: async (operation) =>
      prisma.$transaction((tx) => operation(createTransaction(tx))),
    isUniqueConflict,
  };
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
