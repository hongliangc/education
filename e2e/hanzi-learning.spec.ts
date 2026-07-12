import { expect, test } from "playwright/test";

test("selected Hanzi session reaches completion without resetting", async ({ page }) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  await page.goto("/play/writing");
  await expect(page.getByRole("heading", { name: "汉字探险岛" })).toBeVisible();

  const start = page.getByRole("button", { name: /开始校验/ });
  await expect(start).toBeEnabled();
  const label = await start.textContent();
  const total = Number.parseInt(label?.match(/(\d+) 题/)?.[1] ?? "0", 10);
  expect(total).toBeGreaterThan(0);
  await start.click();

  for (let question = 1; question <= total; question += 1) {
    await expect(page.getByText(`第 ${question} 题 / 共 ${total} 题`)).toBeVisible();
    await page.locator(".grid.grid-cols-2 button").first().click();
  }

  await expect(page.getByRole("heading", { name: "闯关成功！" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
