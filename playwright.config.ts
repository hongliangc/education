import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "playwright/test";

loadEnvConfig(process.cwd());
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: ".playwright/auth/parent.json",
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: new URL("/login", baseURL).toString(),
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
