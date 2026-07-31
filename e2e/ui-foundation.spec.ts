import { expect, test } from "playwright/test";

test("registration uses the kingdom artwork", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/register");

  await expect(page.getByRole("heading", { name: "创建家长账号" })).toBeVisible();
  await expect(page.getByAltText("向导精灵小星")).toBeVisible();
  await expect(page.locator('img[src*="world-bg-desktop-v1.png"]')).toBeAttached();
});

test("game pages share the kingdom background", async ({ page }) => {
  await page.goto("/shop");

  await expect(page.getByRole("heading", { name: "星星商店" })).toBeVisible();
  await expect(page.locator('img[src*="world-bg-desktop-v1.png"]')).toBeAttached();
  await expect(page.locator('img[src*="world-bg-mobile-v1.png"]')).toBeAttached();
});

test("english island exposes the designed category navigation", async ({ page }) => {
  await page.goto("/english");

  await expect(page.getByRole("heading", { name: "英语岛" })).toBeVisible();
  await page.getByRole("button", { name: "🛒 场景闯关" }).click();
  await expect(page.getByText("看图", { exact: true })).toBeVisible();
});
