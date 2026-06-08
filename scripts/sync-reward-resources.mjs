// Idempotent migration of legacy reading/video unlocks into the unified reward
// system. Safe to re-run; resources/opening balances/permanent unlocks are keyed
// by stable unique columns so a second run creates nothing new.
//
// Usage:
//   node scripts/sync-reward-resources.mjs --dry-run   # report the plan, no writes
//   node scripts/sync-reward-resources.mjs             # apply against DATABASE_URL
import { register } from "node:module";

register("./ts-resolve-hooks.mjs", import.meta.url);

const { PrismaClient } = await import("@prisma/client");
const { STORY_BOOKS } = await import("../content/storybooks/index.ts");
const { applyMigration, planMigration } = await import("../lib/rewards/migration.ts");

function createPrismaMigrationAdapter(prisma) {
  return {
    async ensureResource(spec) {
      const existing = await prisma.rewardResource.findUnique({
        where: {
          scopeKey_resourceType_resourceKey: {
            scopeKey: spec.scopeKey,
            resourceType: spec.resourceType,
            resourceKey: spec.resourceKey,
          },
        },
        select: { id: true },
      });
      if (existing) return existing.id;
      const created = await prisma.rewardResource.create({
        data: {
          scopeKey: spec.scopeKey,
          ownerType: spec.ownerType,
          ownerId: spec.ownerId,
          resourceType: spec.resourceType,
          resourceKey: spec.resourceKey,
          title: spec.title,
          starsCost: spec.starsCost,
          stock: spec.stock,
        },
        select: { id: true },
      });
      return created.id;
    },

    async ensureOpeningBalance(spec) {
      const existing = await prisma.starLedger.findUnique({
        where: { dedupeKey: spec.dedupeKey },
        select: { id: true },
      });
      if (existing) return;
      await prisma.starLedger.create({
        data: {
          childId: spec.childId,
          delta: spec.amount,
          balanceAfter: spec.amount,
          reason: "OPENING_BALANCE",
          dedupeKey: spec.dedupeKey,
        },
      });
    },

    async ensurePermanentRedemption(resourceId, spec) {
      const existing = await prisma.rewardRedemption.findUnique({
        where: { unlockKey: spec.unlockKey },
        select: { id: true },
      });
      if (existing) return;
      // Historical unlocks are imported without touching balances: status
      // COMPLETED, starsSpent 0, and no REDEMPTION ledger row.
      await prisma.rewardRedemption.create({
        data: {
          childId: spec.childId,
          resourceId,
          starsSpent: spec.starsSpent,
          status: "COMPLETED",
          unlockKey: spec.unlockKey,
        },
      });
    },
  };
}

function toMigrationBooks() {
  return STORY_BOOKS.map((book) => ({
    id: book.id,
    title: book.title,
    kind: book.kind,
    chapters: book.chapters.map((chapter) => ({ idx: chapter.idx, title: chapter.title })),
  }));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const prisma = new PrismaClient();
  try {
    const [children, readingProgress, videoUnlocks] = await Promise.all([
      prisma.child.findMany({ select: { id: true, totalStars: true } }),
      prisma.readingProgress.findMany({
        select: {
          childId: true,
          bookId: true,
          lastChapterIdx: true,
          completedChapters: true,
          finished: true,
        },
      }),
      prisma.videoUnlock.findMany({
        select: { childId: true, videoId: true, starsCost: true },
      }),
    ]);

    const input = {
      children,
      books: toMigrationBooks(),
      readingProgress,
      videoUnlocks,
    };

    const plan = planMigration(input);
    console.log(
      `[sync] inputs: children=${children.length} books=${input.books.length} ` +
        `reading=${readingProgress.length} videoUnlocks=${videoUnlocks.length}`,
    );
    console.log(
      `[sync] plan: resources=${plan.resources.length} ` +
        `openingBalances=${plan.openingBalances.length} redemptions=${plan.redemptions.length}`,
    );

    if (dryRun) {
      console.log("[sync] dry-run: no writes performed");
      return;
    }

    const summary = await applyMigration(createPrismaMigrationAdapter(prisma), input);
    console.log(`[sync] applied: ${JSON.stringify(summary)}`);
  } finally {
    await prisma.$disconnect();
  }
}

await main();
