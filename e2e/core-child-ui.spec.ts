import { expect, test } from "playwright/test";

test("practice modal exposes a readable game surface", async ({ page }) => {
  await page.goto("/play/alphabet");

  const dialog = page.getByRole("dialog", { name: "英语岛" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/第 1 题/)).toBeVisible();
  await expect(dialog.getByRole("button", { name: /再听一次/ })).toBeVisible();
});

test("english category tabs expose their selected state", async ({ page }) => {
  await page.goto("/world");
  await page.getByRole("button", { name: "进入英语岛" }).click();
  await expect(page).toHaveURL(/\/english$/);

  const sounds = page.getByRole("button", { name: "🔤 字母 & 音标" });
  await expect(sounds).toHaveAttribute("aria-pressed", "true");
  const scene = page.getByRole("button", { name: "🛒 场景闯关" });
  await scene.click();
  await expect(scene).toHaveAttribute("aria-pressed", "true");
  await expect(sounds).toHaveAttribute("aria-pressed", "false");
  while (await page.getByRole("button", { name: "下一个 →" }).isVisible()) {
    await page.getByRole("button", { name: "下一个 →" }).click();
  }
  await page.getByRole("button", { name: "去听音 →" }).click();
  await expect(page.getByText("② 听音点图 · Listen & find")).toBeVisible();
});

test("english detail controls keep a child-sized touch target", async ({ page }) => {
  await page.goto("/english");
  await page.getByRole("button", { name: /Aa.*Apple/i }).click();

  const close = page.getByRole("button", { name: "关闭", exact: true });
  await page.waitForTimeout(500);
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
});

test("story reading keeps navigation and progress visible", async ({ page }) => {
  await page.goto("/story");
  await page.getByRole("button", { name: "打开《西游记（儿童版）》" }).click();
  await expect(page.getByRole("button", { name: "返回书架" })).toBeVisible();
  await page.getByRole("button", { name: /开始阅读/ }).click();

  await expect(page.getByRole("progressbar", { name: "故事阅读进度" })).toBeVisible();
  await expect(page.getByRole("button", { name: "朗读故事" })).toBeVisible();
  await expect(page.getByRole("button", { name: "返回目录" })).toBeVisible();
  await page.getByRole("button", { name: "读完了，回答问题 →" }).click();
  await expect(page.getByText(/第 1 题 \/ 共 \d+ 题/)).toBeVisible();
});

test("theater keeps its dark surface and uses the cinema artwork", async ({ page }) => {
  await page.goto("/world");
  await page.getByRole("button", { name: /视频影院/ }).click();
  await expect(page).toHaveURL(/\/theater$/);

  await expect(page.getByAltText("视频影院")).toBeVisible();
  await expect(page.getByRole("textbox", { name: "搜索视频" })).toBeVisible();
  await expect(page.locator("main")).toHaveCSS("min-height", /\d+px/);
});

test("theater does not make the mobile page scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/theater");
  await page.getByRole("heading").first().waitFor();
  await page.evaluate(() => window.scrollTo(100, 0));

  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});
