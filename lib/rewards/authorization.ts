import type { RewardOwnerType } from "./types";

export type RewardManagerRole = "PARENT" | "ADMIN";

export interface RewardActor {
  id: string;
  role: RewardManagerRole;
}

export interface ResourceOwner {
  ownerType: RewardOwnerType;
  ownerId: string | null;
}

interface SessionLikeUser {
  id?: string | null;
  role?: string | null;
}

// Only authenticated managers (parents, admins) act on reward management APIs.
export function resolveRewardActor(
  user: SessionLikeUser | null | undefined,
): RewardActor | null {
  if (!user?.id) return null;
  if (user.role === "PARENT" || user.role === "ADMIN") {
    return { id: user.id, role: user.role };
  }
  return null;
}

// The ownership scope under which an actor creates and edits resources.
export function manageScopeFor(actor: RewardActor): ResourceOwner {
  return actor.role === "ADMIN"
    ? { ownerType: "PLATFORM", ownerId: null }
    : { ownerType: "FAMILY", ownerId: actor.id };
}

// Whether the actor may mutate a resource with the given ownership.
// Parents own only their family scope; admins own only the platform scope.
export function canManageResource(actor: RewardActor, owner: ResourceOwner): boolean {
  if (actor.role === "ADMIN") return owner.ownerType === "PLATFORM";
  return owner.ownerType === "FAMILY" && owner.ownerId === actor.id;
}

// Whether the actor may act on a child-scoped record given the child's parentId.
export function canAccessChild(actor: RewardActor, childParentId: string): boolean {
  return actor.role === "ADMIN" || childParentId === actor.id;
}

// ownerId handed to the redemption service for scoping; undefined = platform-wide (admin).
export function redemptionScopeOwnerId(actor: RewardActor): string | undefined {
  return actor.role === "ADMIN" ? undefined : actor.id;
}
