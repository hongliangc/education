import "server-only";
import { prisma } from "@/lib/db";
import { STORY_BOOKS } from "@/content/storybooks";
import { storyResourceSpecs } from "@/lib/rewards/story-resources";
import type { MigrationBook } from "@/lib/rewards/migration";

function toMigrationBooks(): MigrationBook[] {
  return STORY_BOOKS.map((book) => ({
    id: book.id,
    title: book.title,
    kind: book.kind,
    chapters: book.chapters.map((chapter) => ({ idx: chapter.idx, title: chapter.title })),
  }));
}

let ensured: Promise<void> | null = null;

// Idempotently seed the platform STORY_CHAPTER / STORY_TALE resource rows so the reward
// catalog can hand out a real resourceId for every story chapter and tale. Without this,
// freshly deployed databases (boot only runs `prisma db push`) have no story resources and
// paid chapters open for free. Memoized per server process; a failed attempt clears the memo
// so the next catalog read retries. `createMany` + `skipDuplicates` keeps it cheap and safe
// to call on every catalog request, and automatically covers any newly added book.
export function ensurePlatformStoryResources(): Promise<void> {
  if (!ensured) {
    ensured = (async () => {
      const specs = storyResourceSpecs(toMigrationBooks());
      if (specs.length === 0) return;
      await prisma.rewardResource.createMany({
        data: specs.map((spec) => ({
          scopeKey: spec.scopeKey,
          ownerType: spec.ownerType,
          ownerId: spec.ownerId,
          resourceType: spec.resourceType,
          resourceKey: spec.resourceKey,
          title: spec.title,
          starsCost: spec.starsCost,
          stock: spec.stock,
        })),
        skipDuplicates: true,
      });
    })().catch((error) => {
      ensured = null;
      throw error;
    });
  }
  return ensured;
}
