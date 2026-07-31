import { expect, test } from "playwright/test";

test("world to math keeps the task inside the mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/world");
  await page.getByRole("button", { name: "进入趣味算术" }).click();

  const dialog = page.getByRole("dialog", { name: "趣味算术" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /学习/ }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("math round exposes progress without relying on color", async ({ page }) => {
  await page.goto("/play/math");
  await page.getByRole("button", { name: "🎯 综合练习" }).click();

  await expect(page.getByRole("progressbar", { name: "数学答题进度" })).toBeVisible();
  await expect(page.getByText(/第 1 题 \/ 共 \d+ 题/)).toBeVisible();
});

test("world to writing exposes a child-sized close control", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/world");
  await page.getByRole("button", { name: "进入汉字学习" }).click();

  const close = page.getByRole("button", { name: "关闭汉字学习" });
  await page.waitForTimeout(500);
  const box = await close.boundingBox();
  expect(box?.width).toBeGreaterThanOrEqual(44);
  expect(box?.height).toBeGreaterThanOrEqual(44);
  const title = await page.getByRole("heading", { name: "汉字探险岛" }).boundingBox();
  expect(title?.y).toBeGreaterThanOrEqual(64);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

test("writing canvas keeps its controls child-sized", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/writing");
  await page.getByRole("button", { name: "写字练习" }).click();

  await expect(page.getByLabel(/临摹/)).toBeVisible();
  const clear = page.getByRole("button", { name: "🧽 清理" });
  const box = await clear.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("writing pronunciation sends one bounded single-character utterance", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/writing");
  await page.getByRole("button", { name: "写字练习" }).click();

  const requests: string[] = [];
  page.on("request", (request) => {
    if (request.url().endsWith("/api/speech/tts")) {
      const body = request.postDataJSON() as { text?: string };
      if (body.text) requests.push(body.text);
    }
  });

  await page.getByRole("button", { name: "🔊 听这个字" }).click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toMatch(/^.。$/u);
});

test("long whole-syllable pinyin stays inside the pronunciation card", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/play/writing");
  await page.getByRole("button", { name: "拼音乐园" }).click();
  await page.getByRole("button", { name: "整体认读", exact: true }).click();

  for (const syllable of ["yuan", "ying"]) {
    await page.getByRole("button", { name: syllable, exact: true }).first().click();
    const display = page.getByRole("button", { name: syllable, exact: true }).nth(1);
    await expect(display).toBeVisible();
    expect(await display.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  }
});

test("literature reading keeps navigation, progress and next action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/world");
  await page.getByRole("button", { name: "进入诸子智慧" }).click();
  await page.getByRole("button", { name: /阅读《/ }).first().click();

  await expect(page.getByRole("button", { name: "诸子智慧" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "故事阅读进度" })).toBeVisible();
  await expect(page.getByRole("button", { name: "朗读故事" })).toBeVisible();
  await expect(page.getByRole("button", { name: "读完了，回答问题 →" })).toBeVisible();
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
});

test("literature version switch exposes its selected state", async ({ page }) => {
  await page.goto("/literature/read/zhuangzi-jingdizhiwa");

  const story = page.getByRole("button", { name: "📖 故事版" });
  const classic = page.getByRole("button", { name: "🏛️ 经典原文" });
  await expect(story).toHaveAttribute("aria-pressed", "true");
  await classic.click();
  await expect(classic).toHaveAttribute("aria-pressed", "true");
  await expect(story).toHaveAttribute("aria-pressed", "false");
});

test("history long scroll uses keyboard-accessible controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/world");
  await page.getByRole("button", { name: "进入上下五千年" }).click();

  await expect(page.getByRole("button", { name: "返回世界" })).toBeVisible();
  await page.getByRole("button", { name: "展开长卷" }).click();
  const threeKingdoms = page.getByRole("button", { name: /进入三国/ });
  await expect(threeKingdoms).toBeVisible();
  await threeKingdoms.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/history\/three-kingdoms$/);
});

test("Three Kingdoms tabs expose their selected state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/history/three-kingdoms");

  const people = page.getByRole("button", { name: "群英谱" });
  await people.click();
  await expect(people).toHaveAttribute("aria-current", "true");
  const box = await people.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});
