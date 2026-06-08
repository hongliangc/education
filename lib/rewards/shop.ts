export const REDEMPTION_STATUS_LABEL: Record<string, string> = {
  COMPLETED: "已完成",
  PENDING_FULFILLMENT: "待发放",
  FULFILLED: "已发放",
  REJECTED_REFUNDED: "已退回",
};

export function redemptionStatusLabel(status: string): string {
  return REDEMPTION_STATUS_LABEL[status] ?? status;
}

export function stockLabel(stock: number | null): string {
  if (stock === null) return "不限";
  if (stock <= 0) return "已抢光";
  return `剩 ${stock}`;
}

export interface ShopRewardLike {
  isActive?: boolean;
}

// The shop only shows active rewards; sold-out ones stay visible but disabled.
export function visibleShopRewards<T extends ShopRewardLike>(rewards: T[]): T[] {
  return rewards.filter((reward) => reward.isActive !== false);
}

export function canAfford(balance: number, cost: number, stock: number | null): boolean {
  if (stock !== null && stock <= 0) return false;
  return balance >= cost;
}
