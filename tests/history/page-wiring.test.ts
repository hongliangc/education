import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("/history 入口装配历史长卷 HistoryScroll", () => {
  const page = readFileSync("app/(game)/history/page.tsx", "utf8");
  assert.match(page, /HistoryScroll/);
  const scroll = readFileSync("components/history/HistoryScroll.tsx", "utf8");
  assert.match(scroll, /DYNASTY_TIMELINE/);
  assert.match(scroll, /\/history\/three-kingdoms|item\.href/);
});

test("/history/three-kingdoms 装配详情页 5 Tab 并复用 ChapterReader", () => {
  const page = readFileSync("app/(game)/history/three-kingdoms/page.tsx", "utf8");
  // 详情页编排：Hero + 5 Tab + 复用阅读流
  assert.match(page, /DetailHero/);
  assert.match(page, /FactionTabs/);
  assert.match(page, /StoryTab/);
  assert.match(page, /PeopleTab/);
  assert.match(page, /EventsTab/);
  assert.match(page, /MapTab/);
  assert.match(page, /TasksTab/);
  assert.match(page, /ThreeKingdomsReader/);
  // 故事卡仍在听故事 Tab 内复用
  const storyTab = readFileSync("components/history/threeKingdoms/StoryTab.tsx", "utf8");
  assert.match(storyTab, /StoryCardRow/);
  const reader = readFileSync("components/history/ThreeKingdomsReader.tsx", "utf8");
  assert.match(reader, /ChapterReader/);
  assert.match(reader, /\/api\/sessions/);
});

test("全站字体变量统一使用微软雅黑", () => {
  const globals = readFileSync("app/globals.css", "utf8");
  assert.match(globals, /--font-sans: "Microsoft YaHei", "微软雅黑", sans-serif/);
  assert.match(globals, /--font-history: var\(--font-sans\)/);
});
