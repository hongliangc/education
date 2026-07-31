import { expect, test, type Locator } from "playwright/test";

const ISLANDS = [
  "汉字学习",
  "英语岛",
  "诸子智慧",
  "趣味算术",
  "单词配对",
  "故事智慧",
  "上下五千年",
] as const;

test("desktop world islands do not overlap", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/world");

  const boxes = await Promise.all(
    ISLANDS.map(async (label) => requiredBox(page.getByRole("button", { name: `进入${label}` }))),
  );

  for (let left = 0; left < boxes.length; left += 1) {
    for (let right = left + 1; right < boxes.length; right += 1) {
      const a = boxes[left];
      const b = boxes[right];
      const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
      expect(
        overlapX <= 0 || overlapY <= 0,
        `${ISLANDS[left]} overlaps ${ISLANDS[right]} by ${overlapX.toFixed(1)}×${overlapY.toFixed(1)}px`,
      ).toBe(true);
    }
  }
});

async function requiredBox(locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  if (!box) throw new Error("island has no bounding box");
  return box;
}
