export const DEFAULT_VIDEO_COST = parseVideoDefaultCost(process.env.VIDEO_DEFAULT_COST);

export interface PricedVideoItem {
  id: string;
  title: string;
  order: number;
  cost: number;
}

export type UnlockableVideoItem<T extends PricedVideoItem = PricedVideoItem> = T & {
  unlocked: boolean;
};

export interface UnlockQuote {
  canUnlock: boolean;
  cost: number;
  balanceAfter: number;
  needed: number;
}

function parseVideoDefaultCost(value: string | undefined): number {
  if (!value) return 20;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 20;
}

export function resolveVideoCost(value: unknown): number {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : DEFAULT_VIDEO_COST;
}

export function mergeVideoUnlockState<T extends PricedVideoItem>(
  videos: T[],
  unlockedIds: ReadonlySet<string>,
): UnlockableVideoItem<T>[] {
  return videos.map((video) => ({
    ...video,
    unlocked: video.cost === 0 || unlockedIds.has(video.id),
  }));
}

// A video plays when it is free or the child holds an unlock (unified or legacy).
export function canPlayVideo(cost: number, hasUnlock: boolean): boolean {
  return cost === 0 || hasUnlock;
}

export function calculateUnlockQuote(cost: number, balance: number): UnlockQuote {
  const safeCost = Math.max(0, Math.floor(cost));
  const safeBalance = Math.max(0, Math.floor(balance));
  const needed = Math.max(0, safeCost - safeBalance);

  return {
    canUnlock: needed === 0,
    cost: safeCost,
    balanceAfter: needed === 0 ? safeBalance - safeCost : safeBalance,
    needed,
  };
}
