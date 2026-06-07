import type { RewardOwnerType, RewardResourceType } from "./types";

export interface EffectiveCostInput {
  platform: number;
  family: number | null;
  firstChapter: boolean;
}

function assertNonNegativeInteger(value: number, field: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${field} must be a non-negative integer`);
  }
}

export function resolveEffectiveCost({
  platform,
  family,
  firstChapter,
}: EffectiveCostInput): number {
  if (firstChapter) {
    return 0;
  }

  assertNonNegativeInteger(platform, "platform");
  if (family !== null) {
    assertNonNegativeInteger(family, "family");
    return family;
  }

  return platform;
}

export function makeUnlockKey(
  childId: string,
  resourceType: RewardResourceType,
  resourceKey: string,
): string {
  return `${childId}:${resourceType}:${resourceKey}`;
}

// All RewardResource create/upsert paths must derive scopeKey through this helper.
export function makeResourceScopeKey(
  ownerType: RewardOwnerType,
  ownerId?: string | null,
): string {
  if (ownerType === "PLATFORM") {
    if (ownerId !== null && ownerId !== undefined) {
      throw new Error("PLATFORM resources must not have an ownerId");
    }

    return "PLATFORM";
  }

  if (ownerId === null || ownerId === undefined || ownerId.trim() === "") {
    throw new Error("FAMILY resources require a non-empty ownerId");
  }

  return `FAMILY:${ownerId}`;
}
