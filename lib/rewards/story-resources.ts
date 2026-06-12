// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { planMigration, type MigrationBook, type PlatformResourceSpec } from "./migration.ts";

// Platform STORY_CHAPTER / STORY_TALE resource specs derived from story content. These rows
// must exist as RewardResource records, otherwise the reward catalog returns resourceId:null
// for a chapter and the book page falls through its "open without charging" branch — handing
// out paid chapters for free. Reusing planMigration keeps the cost rules (free first chapter,
// DEFAULT_CHAPTER_COST, DEFAULT_TALE_COST) in one place.
export function storyResourceSpecs(books: MigrationBook[]): PlatformResourceSpec[] {
  const plan = planMigration({ children: [], books, readingProgress: [], videoUnlocks: [] });
  return plan.resources.filter(
    (resource) =>
      resource.resourceType === "STORY_CHAPTER" || resource.resourceType === "STORY_TALE",
  );
}
