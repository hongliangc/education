import { expect, test } from "playwright/test";

test("selected Hanzi session reaches completion without resetting", async ({ page }) => {
  await page.goto("/play/writing");
  await expect(page.getByRole("heading", { name: "汉字探险岛" })).toBeVisible();

  const start = page.getByRole("button", { name: /开始校验/ });
  await expect(start).toBeEnabled();
  await start.click();

  for (let question = 1; question <= 8; question += 1) {
    await expect(page.getByText(`第 ${question} 题 / 共 8 题`)).toBeVisible();
    await page.locator(".grid.grid-cols-2 button").first().click();
  }

  await expect(page.getByRole("heading", { name: "闯关成功！" })).toBeVisible();
});
