#!/usr/bin/env node
// 多端预览截图：用 Playwright 的真 WebKit + Chromium，把指定 URL 在 iPhone/横屏/
// Android/PC 视口各截一张图到 tmp/preview/，用于本地快速核对移动端排版。
//
// 为什么：WSL2 上没有真正的 iOS 模拟器（仅 macOS 有）。Playwright 自带真 WebKit，
// 截图比 Chrome 设备模式（Blink）更接近 iPhone；但全屏 / 音量 / 自动播放等
// iOS 系统级“行为”仍以真机为准（发现网后用 iPhone 验）。
//
// 用法：
//   node scripts/preview-devices.mjs                      # 截 http://localhost/
//   node scripts/preview-devices.mjs http://localhost/login
//   交互体验（像手机一样点）：npx playwright open --device="iPhone 13" http://localhost/
//
// 首次需下载浏览器内核：npx playwright install webkit chromium

import { chromium, webkit, devices } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const url = process.argv[2] ?? "http://localhost/";
const outDir = path.resolve("tmp/preview");
const engines = { chromium, webkit };

// [引擎, 标签, 设备名 | 自定义 context 选项]
const targets = [
  ["webkit", "iPhone 13", "iPhone 13"],
  ["webkit", "iPhone 13 landscape", "iPhone 13 landscape"], // 横屏适配
  ["chromium", "Pixel 7", "Pixel 7"],
  ["chromium", "Desktop 1440", { viewport: { width: 1440, height: 900 } }],
];

await mkdir(outDir, { recursive: true });

for (const [engineName, label, profile] of targets) {
  const context = typeof profile === "string" ? devices[profile] : profile;
  if (!context) {
    console.error(`✗ 跳过未知设备：${label}`);
    continue;
  }
  let browser;
  try {
    browser = await engines[engineName].launch();
    const page = await (await browser.newContext(context)).newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const file = path.join(outDir, `${engineName}-${label.replace(/[^\w]+/g, "-")}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`✓ ${engineName} · ${label} → ${file}`);
  } catch (err) {
    console.error(`✗ ${engineName} · ${label}: ${err.message.split("\n")[0]}`);
  } finally {
    await browser?.close();
  }
}

console.log(`\n截图目录：${outDir}`);
