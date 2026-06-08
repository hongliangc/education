import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { canAfford, redemptionStatusLabel, stockLabel, visibleShopRewards } from "../../lib/rewards/shop.ts";

test("inactive rewards are hidden from the shop", () => {
  const rewards = [
    { id: "a", isActive: true },
    { id: "b", isActive: false },
    { id: "c" },
  ];
  assert.deepEqual(
    visibleShopRewards(rewards).map((r) => r.id),
    ["a", "c"],
  );
});

test("shared stock renders stable labels", () => {
  assert.equal(stockLabel(null), "不限");
  assert.equal(stockLabel(3), "剩 3");
  assert.equal(stockLabel(0), "已抢光");
});

test("redemption statuses map to stable Chinese labels", () => {
  assert.equal(redemptionStatusLabel("COMPLETED"), "已完成");
  assert.equal(redemptionStatusLabel("PENDING_FULFILLMENT"), "待发放");
  assert.equal(redemptionStatusLabel("FULFILLED"), "已发放");
  assert.equal(redemptionStatusLabel("REJECTED_REFUNDED"), "已退回");
  assert.equal(redemptionStatusLabel("MYSTERY"), "MYSTERY");
});

test("affordability respects balance and shared stock", () => {
  assert.equal(canAfford(10, 8, null), true);
  assert.equal(canAfford(5, 8, null), false);
  assert.equal(canAfford(10, 8, 0), false);
  assert.equal(canAfford(10, 8, 2), true);
});
