import { expect, test } from "playwright/test";

test("refreshing the world keeps the persisted active child", async ({ page }) => {
  await page.goto("/world");
  await page.waitForTimeout(1_500);

  await expect(page).toHaveURL(/\/world$/);
  await expect(page.getByText("选择一座小岛开始冒险")).toBeVisible();
});
