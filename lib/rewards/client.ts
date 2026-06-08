import type { ChildRewardCatalog } from "@/lib/rewards/catalog";

export interface ChapterUnlockInput {
  unlocked: boolean;
  available: boolean;
  starsCost: number;
}

export type ChapterUnlockKind =
  | "unlocked"
  | "free"
  | "affordable"
  | "insufficient"
  | "locked";

export interface ChapterUnlockView {
  kind: ChapterUnlockKind;
  label: string;
  cost: number;
  canOpen: boolean; // already unlocked -> open the reader directly
  canRedeem: boolean; // free or affordable -> may unlock now
}

// Pure display state for a chapter/tale tile given the child's balance.
export function chapterUnlockState(
  input: ChapterUnlockInput,
  balance: number,
): ChapterUnlockView {
  if (input.unlocked) {
    return { kind: "unlocked", label: "已解锁", cost: input.starsCost, canOpen: true, canRedeem: false };
  }
  if (!input.available) {
    return { kind: "locked", label: "先解锁上一章", cost: input.starsCost, canOpen: false, canRedeem: false };
  }
  if (input.starsCost <= 0) {
    return { kind: "free", label: "免费", cost: 0, canOpen: false, canRedeem: true };
  }
  if (balance >= input.starsCost) {
    return { kind: "affordable", label: `⭐${input.starsCost}`, cost: input.starsCost, canOpen: false, canRedeem: true };
  }
  return { kind: "insufficient", label: `⭐${input.starsCost} 不够`, cost: input.starsCost, canOpen: false, canRedeem: false };
}

export async function fetchRewardCatalog(childId: string): Promise<ChildRewardCatalog> {
  const res = await fetch(`/api/rewards/catalog?childId=${encodeURIComponent(childId)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data.error === "string" ? data.error : "catalog_failed");
  }
  return res.json();
}

export interface RedeemOutcome {
  balance: number;
  redemption: {
    id: string;
    status: string;
    unlockKey: string | null;
    resourceKey: string;
  };
}

export class RedeemError extends Error {
  readonly code: string;
  readonly needed?: number;
  constructor(code: string, needed?: number) {
    super(code);
    this.code = code;
    this.needed = needed;
  }
}

export async function redeemRewardResource(
  resourceId: string,
  childId: string,
): Promise<RedeemOutcome> {
  const res = await fetch(`/api/rewards/${encodeURIComponent(resourceId)}/redeem`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ childId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new RedeemError(
      typeof data.error === "string" ? data.error : "redeem_failed",
      typeof data.needed === "number" ? data.needed : undefined,
    );
  }
  return data as RedeemOutcome;
}
