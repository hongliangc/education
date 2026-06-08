import "server-only";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { STORY_BOOKS } from "@/content/storybooks";
import { DEFAULT_CHAPTER_COST, DEFAULT_TALE_COST } from "@/lib/rewards/migration";
import { makeResourceScopeKey, makeUnlockKey } from "@/lib/rewards/pricing";
import {
  canManageResource,
  redemptionScopeOwnerId,
  type ResourceOwner,
  type RewardActor,
} from "@/lib/rewards/authorization";
import { fulfillRedemption, rejectAndRefundRedemption } from "@/lib/rewards/service";
import { RewardAccessDeniedError } from "@/lib/rewards/errors";

type StoryPriceType = "STORY_CHAPTER" | "STORY_TALE";

export interface StoryPriceInput {
  resourceType: StoryPriceType;
  resourceKey: string;
  starsCost: number;
}

export interface StoryPriceRow {
  resourceType: StoryPriceType;
  resourceKey: string;
  bookId: string;
  chapterIdx: number | null;
  title: string;
  firstChapter: boolean;
  platformCost: number;
  ownerOverride: number | null;
}

export interface RewardInput {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  starsCost: number;
  stock?: number | null;
}

function isFirstChapter(resourceType: StoryPriceType, resourceKey: string): boolean {
  return resourceType === "STORY_CHAPTER" && /:0$/.test(resourceKey);
}

function normalizeCost(value: number): number {
  return Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
}

// Coerce free-form JSON input to a trimmed, length-capped string or null.
function toOptionalText(value: string | null | undefined, max: number): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function storyTitle(resourceType: StoryPriceType, resourceKey: string): string {
  if (resourceType === "STORY_TALE") {
    return STORY_BOOKS.find((book) => book.id === resourceKey)?.title ?? resourceKey;
  }
  const separator = resourceKey.lastIndexOf(":");
  const bookId = resourceKey.slice(0, separator);
  const idx = Number(resourceKey.slice(separator + 1));
  const book = STORY_BOOKS.find((entry) => entry.id === bookId);
  const chapter = book?.chapters.find((entry) => entry.idx === idx);
  if (!book) return resourceKey;
  return chapter ? `${book.title} · ${chapter.title}` : book.title;
}

export async function listStoryPrices(owner: ResourceOwner): Promise<StoryPriceRow[]> {
  const ownerScope = makeResourceScopeKey(owner.ownerType, owner.ownerId);
  const resources = await prisma.rewardResource.findMany({
    where: {
      resourceType: { in: ["STORY_CHAPTER", "STORY_TALE"] },
      scopeKey: { in: Array.from(new Set(["PLATFORM", ownerScope])) },
    },
    select: { scopeKey: true, resourceType: true, resourceKey: true, starsCost: true },
  });

  const platformByKey = new Map<string, number>();
  const ownerByKey = new Map<string, number>();
  for (const resource of resources) {
    const key = `${resource.resourceType}:${resource.resourceKey}`;
    if (resource.scopeKey === "PLATFORM") platformByKey.set(key, resource.starsCost);
    if (resource.scopeKey === ownerScope) ownerByKey.set(key, resource.starsCost);
  }

  const rows: StoryPriceRow[] = [];
  for (const book of STORY_BOOKS) {
    if (book.kind === "tale") {
      const key = `STORY_TALE:${book.id}`;
      rows.push({
        resourceType: "STORY_TALE",
        resourceKey: book.id,
        bookId: book.id,
        chapterIdx: null,
        title: book.title,
        firstChapter: false,
        platformCost: platformByKey.get(key) ?? DEFAULT_TALE_COST,
        ownerOverride: ownerByKey.get(key) ?? null,
      });
      continue;
    }
    for (const chapter of book.chapters) {
      const resourceKey = `${book.id}:${chapter.idx}`;
      const key = `STORY_CHAPTER:${resourceKey}`;
      const firstChapter = chapter.idx === 0;
      rows.push({
        resourceType: "STORY_CHAPTER",
        resourceKey,
        bookId: book.id,
        chapterIdx: chapter.idx,
        title: `${book.title} · ${chapter.title}`,
        firstChapter,
        platformCost: firstChapter ? 0 : platformByKey.get(key) ?? DEFAULT_CHAPTER_COST,
        ownerOverride: ownerByKey.get(key) ?? null,
      });
    }
  }
  return rows;
}

export async function upsertStoryPrice(owner: ResourceOwner, input: StoryPriceInput) {
  const scopeKey = makeResourceScopeKey(owner.ownerType, owner.ownerId);
  const starsCost = isFirstChapter(input.resourceType, input.resourceKey)
    ? 0
    : normalizeCost(input.starsCost);
  return prisma.rewardResource.upsert({
    where: {
      scopeKey_resourceType_resourceKey: {
        scopeKey,
        resourceType: input.resourceType,
        resourceKey: input.resourceKey,
      },
    },
    create: {
      scopeKey,
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      resourceType: input.resourceType,
      resourceKey: input.resourceKey,
      title: storyTitle(input.resourceType, input.resourceKey),
      starsCost,
      stock: null,
      isActive: true,
    },
    update: { starsCost, isActive: true },
  });
}

export async function listRewards(owner: ResourceOwner) {
  return prisma.rewardResource.findMany({
    where: {
      resourceType: "REWARD",
      scopeKey: makeResourceScopeKey(owner.ownerType, owner.ownerId),
    },
    orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
  });
}

export async function createReward(owner: ResourceOwner, input: RewardInput) {
  return prisma.rewardResource.create({
    data: {
      scopeKey: makeResourceScopeKey(owner.ownerType, owner.ownerId),
      ownerType: owner.ownerType,
      ownerId: owner.ownerId,
      resourceType: "REWARD",
      resourceKey: randomUUID(),
      title: toOptionalText(input.title, 60) ?? "奖励",
      description: toOptionalText(input.description, 280),
      imageUrl: toOptionalText(input.imageUrl, 500),
      starsCost: normalizeCost(input.starsCost),
      stock: input.stock === null || input.stock === undefined ? null : Math.max(0, Math.floor(input.stock)),
      isActive: true,
    },
  });
}

async function loadManagedResource(actor: RewardActor, id: string) {
  const resource = await prisma.rewardResource.findUnique({
    where: { id },
    select: { id: true, ownerType: true, ownerId: true, resourceType: true },
  });
  if (!resource) return null;
  if (!canManageResource(actor, { ownerType: resource.ownerType === "FAMILY" ? "FAMILY" : "PLATFORM", ownerId: resource.ownerId })) {
    throw new RewardAccessDeniedError();
  }
  return resource;
}

export async function updateReward(actor: RewardActor, id: string, patch: Partial<RewardInput> & { isActive?: boolean }) {
  const resource = await loadManagedResource(actor, id);
  if (!resource || resource.resourceType !== "REWARD") return null;
  return prisma.rewardResource.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { title: toOptionalText(patch.title, 60) ?? "奖励" } : {}),
      ...(patch.description !== undefined ? { description: toOptionalText(patch.description, 280) } : {}),
      ...(patch.imageUrl !== undefined ? { imageUrl: toOptionalText(patch.imageUrl, 500) } : {}),
      ...(patch.starsCost !== undefined ? { starsCost: normalizeCost(patch.starsCost) } : {}),
      ...(patch.stock !== undefined ? { stock: patch.stock === null ? null : Math.max(0, Math.floor(patch.stock ?? 0)) } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
    },
  });
}

export async function deactivateReward(actor: RewardActor, id: string) {
  const resource = await loadManagedResource(actor, id);
  if (!resource || resource.resourceType !== "REWARD") return null;
  return prisma.rewardResource.update({ where: { id }, data: { isActive: false } });
}

export async function listManagedRedemptions(actor: RewardActor, status?: string) {
  return prisma.rewardRedemption.findMany({
    where: {
      ...(actor.role === "ADMIN" ? {} : { child: { parentId: actor.id } }),
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      child: { select: { id: true, name: true } },
      resource: { select: { resourceType: true, resourceKey: true, title: true } },
    },
  });
}

// Videos come from the external Aliyun catalog, so their platform resource is
// created/refreshed on demand from the catalog's current cost before redeeming.
export async function upsertVideoResource(
  videoId: string,
  title: string,
  cost: number,
): Promise<string> {
  const scopeKey = makeResourceScopeKey("PLATFORM");
  const resourceTitle = toOptionalText(title, 60) ?? videoId;
  const resource = await prisma.rewardResource.upsert({
    where: {
      scopeKey_resourceType_resourceKey: { scopeKey, resourceType: "VIDEO", resourceKey: videoId },
    },
    create: {
      scopeKey,
      ownerType: "PLATFORM",
      ownerId: null,
      resourceType: "VIDEO",
      resourceKey: videoId,
      title: resourceTitle,
      starsCost: normalizeCost(cost),
      stock: null,
      isActive: true,
    },
    update: { starsCost: normalizeCost(cost), title: resourceTitle, isActive: true },
    select: { id: true },
  });
  return resource.id;
}

// Unified video unlocks, with a fallback to legacy VideoUnlock rows for pre-migration data.
export async function getUnlockedVideoIds(childId: string): Promise<Set<string>> {
  const [redemptions, legacy] = await Promise.all([
    prisma.rewardRedemption.findMany({
      where: { childId, resource: { resourceType: "VIDEO" } },
      select: { resource: { select: { resourceKey: true } } },
    }),
    prisma.videoUnlock.findMany({ where: { childId }, select: { videoId: true } }),
  ]);
  const ids = new Set<string>();
  for (const row of redemptions) ids.add(row.resource.resourceKey);
  for (const row of legacy) ids.add(row.videoId);
  return ids;
}

export async function isVideoUnlocked(childId: string, videoId: string): Promise<boolean> {
  const [redemption, legacy] = await Promise.all([
    prisma.rewardRedemption.findUnique({
      where: { unlockKey: makeUnlockKey(childId, "VIDEO", videoId) },
      select: { id: true },
    }),
    prisma.videoUnlock.findUnique({
      where: { childId_videoId: { childId, videoId } },
      select: { id: true },
    }),
  ]);
  return redemption !== null || legacy !== null;
}

export async function fulfillManagedRedemption(actor: RewardActor, redemptionId: string, note?: string) {
  await fulfillRedemption({
    redemptionId,
    fulfillerId: actor.id,
    ownerId: redemptionScopeOwnerId(actor),
    note,
  });
}

export async function rejectManagedRedemption(actor: RewardActor, redemptionId: string, note?: string) {
  return rejectAndRefundRedemption({
    redemptionId,
    fulfillerId: actor.id,
    ownerId: redemptionScopeOwnerId(actor),
    note,
  });
}
