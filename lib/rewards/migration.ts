// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { makeResourceScopeKey, makeUnlockKey } from "./pricing.ts";
import type { RewardResourceType } from "./types.ts";

// 平台默认价格；首章/迁移历史解锁不受其影响（首章强制为 0，历史解锁 starsSpent=0）。
export const DEFAULT_CHAPTER_COST = 5;
export const DEFAULT_TALE_COST = 8;
export const DEFAULT_VIDEO_COST = 5;

export interface MigrationChapter {
  idx: number;
  title: string;
}

export interface MigrationBook {
  id: string;
  title: string;
  kind: "tale" | "novel";
  chapters: MigrationChapter[];
}

export interface MigrationChild {
  id: string;
  totalStars: number;
}

export interface MigrationReadingProgress {
  childId: string;
  bookId: string;
  lastChapterIdx: number;
  completedChapters: number;
  finished: boolean;
}

export interface MigrationVideoUnlock {
  childId: string;
  videoId: string;
  starsCost: number;
}

export interface MigrationInput {
  children: MigrationChild[];
  books: MigrationBook[];
  readingProgress: MigrationReadingProgress[];
  videoUnlocks: MigrationVideoUnlock[];
}

export interface PlatformResourceSpec {
  scopeKey: string;
  ownerType: "PLATFORM";
  ownerId: null;
  resourceType: RewardResourceType;
  resourceKey: string;
  title: string;
  starsCost: number;
  stock: number | null;
}

export interface OpeningBalanceSpec {
  childId: string;
  amount: number;
  dedupeKey: string;
}

export interface PermanentRedemptionSpec {
  childId: string;
  resourceType: RewardResourceType;
  resourceKey: string;
  unlockKey: string;
  starsSpent: number;
}

export interface MigrationPlan {
  resources: PlatformResourceSpec[];
  openingBalances: OpeningBalanceSpec[];
  redemptions: PermanentRedemptionSpec[];
}

export interface MigrationSummary {
  resources: number;
  openingBalances: number;
  redemptions: number;
}

export interface MigrationAdapter {
  // 按 (scopeKey, resourceType, resourceKey) 幂等创建/复用，返回资源 id。
  ensureResource(spec: PlatformResourceSpec): Promise<string>;
  // 按 dedupeKey 幂等创建开账余额。
  ensureOpeningBalance(spec: OpeningBalanceSpec): Promise<void>;
  // 按 unlockKey 幂等创建永久解锁兑换，不改动余额、不写 REDEMPTION 流水。
  ensurePermanentRedemption(
    resourceId: string,
    spec: PermanentRedemptionSpec,
  ): Promise<void>;
}

const PLATFORM_SCOPE = makeResourceScopeKey("PLATFORM");

function chapterResource(book: MigrationBook, chapter: MigrationChapter): PlatformResourceSpec {
  return {
    scopeKey: PLATFORM_SCOPE,
    ownerType: "PLATFORM",
    ownerId: null,
    resourceType: "STORY_CHAPTER",
    resourceKey: `${book.id}:${chapter.idx}`,
    title: `${book.title} · ${chapter.title}`,
    starsCost: chapter.idx === 0 ? 0 : DEFAULT_CHAPTER_COST,
    stock: null,
  };
}

function taleResource(book: MigrationBook): PlatformResourceSpec {
  return {
    scopeKey: PLATFORM_SCOPE,
    ownerType: "PLATFORM",
    ownerId: null,
    resourceType: "STORY_TALE",
    resourceKey: book.id,
    title: book.title,
    starsCost: DEFAULT_TALE_COST,
    stock: null,
  };
}

function videoResource(videoId: string, starsCost: number): PlatformResourceSpec {
  return {
    scopeKey: PLATFORM_SCOPE,
    ownerType: "PLATFORM",
    ownerId: null,
    resourceType: "VIDEO",
    resourceKey: videoId,
    title: videoId,
    starsCost: starsCost > 0 ? starsCost : DEFAULT_VIDEO_COST,
    stock: null,
  };
}

// 续读 + 通关都计入可访问章节数，迁移后不回退访问权。
function unlockedChapterCount(book: MigrationBook, progress: MigrationReadingProgress): number {
  const reached = Math.max(progress.completedChapters, progress.lastChapterIdx + 1);
  return Math.min(book.chapters.length, Math.max(0, reached));
}

export function planMigration(input: MigrationInput): MigrationPlan {
  const booksById = new Map(input.books.map((book) => [book.id, book]));
  const resourceByKey = new Map<string, PlatformResourceSpec>();
  const redemptionByUnlockKey = new Map<string, PermanentRedemptionSpec>();

  const addResource = (spec: PlatformResourceSpec) => {
    const key = `${spec.resourceType}:${spec.resourceKey}`;
    if (!resourceByKey.has(key)) resourceByKey.set(key, spec);
  };
  const addRedemption = (spec: PermanentRedemptionSpec) => {
    if (!redemptionByUnlockKey.has(spec.unlockKey)) redemptionByUnlockKey.set(spec.unlockKey, spec);
  };

  for (const book of input.books) {
    if (book.kind === "novel") {
      for (const chapter of book.chapters) addResource(chapterResource(book, chapter));
    } else {
      addResource(taleResource(book));
    }
  }

  // 视频资源只能从已有解锁推导（目录来自外部 Aliyun，离线不可枚举）。
  const videoCostById = new Map<string, number>();
  for (const unlock of input.videoUnlocks) {
    const current = videoCostById.get(unlock.videoId) ?? 0;
    videoCostById.set(unlock.videoId, Math.max(current, unlock.starsCost));
  }
  for (const [videoId, cost] of videoCostById) addResource(videoResource(videoId, cost));

  for (const progress of input.readingProgress) {
    const book = booksById.get(progress.bookId);
    if (!book) continue;
    if (book.kind === "novel") {
      const count = unlockedChapterCount(book, progress);
      for (let idx = 0; idx < count; idx += 1) {
        const resourceKey = `${book.id}:${idx}`;
        addRedemption({
          childId: progress.childId,
          resourceType: "STORY_CHAPTER",
          resourceKey,
          unlockKey: makeUnlockKey(progress.childId, "STORY_CHAPTER", resourceKey),
          starsSpent: 0,
        });
      }
    } else {
      addRedemption({
        childId: progress.childId,
        resourceType: "STORY_TALE",
        resourceKey: book.id,
        unlockKey: makeUnlockKey(progress.childId, "STORY_TALE", book.id),
        starsSpent: 0,
      });
    }
  }

  for (const unlock of input.videoUnlocks) {
    addRedemption({
      childId: unlock.childId,
      resourceType: "VIDEO",
      resourceKey: unlock.videoId,
      unlockKey: makeUnlockKey(unlock.childId, "VIDEO", unlock.videoId),
      starsSpent: 0,
    });
  }

  const openingBalances: OpeningBalanceSpec[] = input.children.map((child) => ({
    childId: child.id,
    amount: child.totalStars,
    dedupeKey: `opening:${child.id}`,
  }));

  return {
    resources: [...resourceByKey.values()],
    openingBalances,
    redemptions: [...redemptionByUnlockKey.values()],
  };
}

export async function applyMigration(
  adapter: MigrationAdapter,
  input: MigrationInput,
): Promise<MigrationSummary> {
  const plan = planMigration(input);

  const resourceIdByKey = new Map<string, string>();
  for (const resource of plan.resources) {
    const id = await adapter.ensureResource(resource);
    resourceIdByKey.set(`${resource.resourceType}:${resource.resourceKey}`, id);
  }

  for (const opening of plan.openingBalances) {
    await adapter.ensureOpeningBalance(opening);
  }

  for (const redemption of plan.redemptions) {
    const resourceId = resourceIdByKey.get(
      `${redemption.resourceType}:${redemption.resourceKey}`,
    );
    if (!resourceId) continue;
    await adapter.ensurePermanentRedemption(resourceId, redemption);
  }

  return {
    resources: plan.resources.length,
    openingBalances: plan.openingBalances.length,
    redemptions: plan.redemptions.length,
  };
}
