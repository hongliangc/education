import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { promisify } from "node:util";
import { expect, test as setup } from "playwright/test";

const execFileAsync = promisify(execFile);
const authFile = ".playwright/auth/parent.json";

setup("create fixture and authenticate a parent", async ({ page }) => {
  const email = process.env.E2E_PARENT_EMAIL;
  const password = process.env.E2E_PARENT_PASSWORD;
  const childName = process.env.E2E_CHILD_NAME ?? "验收小朋友";
  if (!email || !password) {
    throw new Error("E2E_PARENT_EMAIL and E2E_PARENT_PASSWORD are required");
  }

  await execFileAsync(process.execPath, ["scripts/ensure-e2e-fixture.mjs"], {
    env: process.env,
  });
  await page.goto("/login");
  await page.getByLabel("手机号或邮箱").fill(email);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "开始冒险" }).click();
  await expect(page).toHaveURL(/\/child-select$/);
  await page.getByRole("button", { name: new RegExp(childName) }).click();
  await expect(page).toHaveURL(/\/world$/);

  await mkdir(".playwright/auth", { recursive: true });
  await page.context().storageState({ path: authFile });
});
