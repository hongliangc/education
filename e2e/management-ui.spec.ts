import { expect, test } from "playwright/test";

const parentPages = [
  { path: "/parent", heading: "家庭总览" },
  { path: "/parent/rewards", heading: "奖励商店" },
  { path: "/parent/story-prices", heading: "故事价格" },
  { path: "/parent/redemptions", heading: "兑换审批" },
] as const;

const adminPages = [
  { path: "/admin", heading: "平台总览" },
  { path: "/admin/resources", heading: "资源与价格" },
  { path: "/admin/redemptions", heading: "兑换记录" },
  { path: "/admin/families", heading: "家庭" },
] as const;

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test.describe(`${viewport.width}x${viewport.height}`, () => {
    test.use({ viewport });

    for (const pageInfo of parentPages) {
      test(`${pageInfo.heading} is usable without page overflow`, async ({ page }) => {
        await page.goto(pageInfo.path);
        await expect(page.getByRole("heading", { name: pageInfo.heading })).toBeVisible();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
      });
    }
  });
}

test("parent navigation exposes the current page", async ({ page }) => {
  await page.goto("/parent/rewards");
  await expect(page.getByRole("link", { name: "奖励商店" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("mobile uses compact navigation instead of the desktop sidebar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/parent");
  await expect(page.locator('nav[aria-label="移动管理导航"]:visible')).toBeVisible();
  await expect(page.locator(".ant-layout-sider:visible")).toHaveCount(0);
});

test("reward drawer has accessible fields", async ({ page }) => {
  await page.goto("/parent/rewards");
  await page.getByRole("button", { name: "新增奖励" }).click();
  await expect(page.getByRole("dialog", { name: "新增奖励" })).toBeVisible();
  await expect(page.getByLabel("名称")).toBeVisible();
  await expect(page.getByRole("button", { name: /保\s*存/ })).toBeVisible();
});

test("unknown route has a safe 404 exit", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /页面不存在/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /返回首页/ })).toHaveAttribute("href", "/");
});

test.describe("administrator pages", () => {
  test.skip(process.env.E2E_EXPECT_ADMIN !== "1", "requires an administrator session");

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    for (const pageInfo of adminPages) {
      test(`${viewport.width}px ${pageInfo.heading} renders without page overflow`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(pageInfo.path);
        await expect(page.getByRole("heading", { name: pageInfo.heading, exact: true })).toBeVisible();
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
      });
    }
  }
});
