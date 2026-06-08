import "server-only";
import { prisma } from "@/lib/db";
import { STORY_BOOKS } from "@/content/storybooks";
import { DEFAULT_CHAPTER_COST, DEFAULT_TALE_COST } from "@/lib/rewards/migration";
import { makeResourceScopeKey, makeUnlockKey, resolveEffectiveCost } from "@/lib/rewards/pricing";
import type { RewardResourceType } from "@/lib/rewards/types";

export interface CatalogChapter {
  resourceId: string | null;
  resourceKey: string;
  chapterIdx: number;
  title: string;
  starsCost: number;
  unlocked: boolean;
  available: boolean;
}

export interface CatalogStory {
  bookId: string;
  title: string;
  emoji: string;
  kind: "novel" | "tale";
  chapters: CatalogChapter[];
}

export interface CatalogReward {
  resourceId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  starsCost: number;
  stock: number | null;
  ownerType: "PLATFORM" | "FAMILY";
}

export interface ChildRewardCatalog {
  childId: string;
  balance: number;
  stories: CatalogStory[];
  rewards: CatalogReward[];
}

interface ScopedResource {
  id: string;
  starsCost: number;
  stock: number | null;
  ownerType: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

function defaultCostFor(type: RewardResourceType): number {
  if (type === "STORY_TALE") return DEFAULT_TALE_COST;
  return DEFAULT_CHAPTER_COST;
}

export async function getChildRewardCatalog(
  childId: string,
  parentId: string,
): Promise<ChildRewardCatalog | null> {
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    select: { id: true, totalStars: true },
  });
  if (!child) return null;

  const familyScope = makeResourceScopeKey("FAMILY", parentId);
  const [resources, redemptions] = await Promise.all([
    prisma.rewardResource.findMany({
      where: {
        isActive: true,
        OR: [{ scopeKey: "PLATFORM" }, { scopeKey: familyScope }],
      },
      select: {
        id: true,
        scopeKey: true,
        resourceType: true,
        resourceKey: true,
        starsCost: true,
        stock: true,
        ownerType: true,
        title: true,
        description: true,
        imageUrl: true,
        sortOrder: true,
      },
    }),
    prisma.rewardRedemption.findMany({
      where: { childId, unlockKey: { not: null } },
      select: { unlockKey: true },
    }),
  ]);

  const platformByKey = new Map<string, ScopedResource>();
  const familyByKey = new Map<string, ScopedResource>();
  const rewards: CatalogReward[] = [];
  for (const resource of resources) {
    const key = `${resource.resourceType}:${resource.resourceKey}`;
    const scoped: ScopedResource = {
      id: resource.id,
      starsCost: resource.starsCost,
      stock: resource.stock,
      ownerType: resource.ownerType,
      title: resource.title,
      description: resource.description,
      imageUrl: resource.imageUrl,
    };
    if (resource.scopeKey === "PLATFORM") platformByKey.set(key, scoped);
    else familyByKey.set(key, scoped);
    if (resource.resourceType === "REWARD") {
      rewards.push({
        resourceId: resource.id,
        title: resource.title,
        description: resource.description,
        imageUrl: resource.imageUrl,
        starsCost: resource.starsCost,
        stock: resource.stock,
        ownerType: resource.ownerType === "FAMILY" ? "FAMILY" : "PLATFORM",
      });
    }
  }

  const unlockedKeys = new Set(
    redemptions.map((redemption) => redemption.unlockKey).filter((key): key is string => key !== null),
  );

  const costFor = (type: RewardResourceType, key: string, firstChapter: boolean): number => {
    const mapKey = `${type}:${key}`;
    const platform = platformByKey.get(mapKey);
    const family = familyByKey.get(mapKey);
    return resolveEffectiveCost({
      platform: platform?.starsCost ?? defaultCostFor(type),
      family: family?.starsCost ?? null,
      firstChapter,
    });
  };
  const idFor = (type: RewardResourceType, key: string): string | null => {
    const mapKey = `${type}:${key}`;
    return (familyByKey.get(mapKey) ?? platformByKey.get(mapKey))?.id ?? null;
  };

  const stories: CatalogStory[] = STORY_BOOKS.map((book) => {
    if (book.kind === "tale") {
      const unlocked = unlockedKeys.has(makeUnlockKey(childId, "STORY_TALE", book.id));
      return {
        bookId: book.id,
        title: book.title,
        emoji: book.emoji,
        kind: "tale",
        chapters: [
          {
            resourceId: idFor("STORY_TALE", book.id),
            resourceKey: book.id,
            chapterIdx: 0,
            title: book.title,
            starsCost: costFor("STORY_TALE", book.id, false),
            unlocked,
            available: true,
          },
        ],
      };
    }

    let previousUnlocked = true;
    const chapters: CatalogChapter[] = book.chapters.map((chapter) => {
      const resourceKey = `${book.id}:${chapter.idx}`;
      const unlocked = unlockedKeys.has(makeUnlockKey(childId, "STORY_CHAPTER", resourceKey));
      const available = chapter.idx === 0 || previousUnlocked;
      previousUnlocked = unlocked;
      return {
        resourceId: idFor("STORY_CHAPTER", resourceKey),
        resourceKey,
        chapterIdx: chapter.idx,
        title: chapter.title,
        starsCost: costFor("STORY_CHAPTER", resourceKey, chapter.idx === 0),
        unlocked,
        available,
      };
    });
    return { bookId: book.id, title: book.title, emoji: book.emoji, kind: "novel", chapters };
  });

  rewards.sort((a, b) => a.starsCost - b.starsCost);

  return { childId: child.id, balance: child.totalStars, stories, rewards };
}
