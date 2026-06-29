import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's native TypeScript test runner requires the explicit extension.
import { personCollectState, knownCount, eventStatus, badgeEarned } from "../../lib/history/threeKingdomsProgress.ts";

// 复刻 three-kingdoms.ts 各章 cardKeys（含赤壁补的 sunquan）。
const chapters = [
  { cardKeys: ["liubei", "guanyu", "zhangfei"] }, // 0 桃园三结义
  { cardKeys: ["liubei", "zhugeliang"] }, // 1 三顾茅庐
  { cardKeys: ["zhugeliang", "zhouyu", "lusu"] }, // 2 草船借箭
  { cardKeys: ["zhouyu", "huanggai", "caocao", "sunquan"] }, // 3 赤壁之战
  { cardKeys: ["zhugeliang", "simayi"] }, // 4 空城计
  { cardKeys: ["zhugeliang", "zhaoyun"] }, // 5 七擒孟获
];
const CORE = [
  "liubei", "guanyu", "zhangfei", "zhugeliang", "zhaoyun",
  "caocao", "simayi", "sunquan", "zhouyu", "lusu", "huanggai",
];

test("人物收集态随阅读进度推进：locked → met → known", () => {
  // 未读任何章：ch0 人物可相识，后续章人物未遇
  assert.equal(personCollectState("liubei", chapters, 0), "met");
  assert.equal(personCollectState("zhugeliang", chapters, 0), "locked");
  // 读完 ch0：ch0 人物升「了解」，ch1 人物变「相识」
  assert.equal(personCollectState("liubei", chapters, 1), "known");
  assert.equal(personCollectState("zhugeliang", chapters, 1), "met");
  // 赤壁补的 sunquan 在 ch3：读完 4 章后为「了解」
  assert.equal(personCollectState("sunquan", chapters, 3), "met");
  assert.equal(personCollectState("sunquan", chapters, 4), "known");
  // 全读完：核心全部「了解」
  for (const k of CORE) {
    assert.equal(personCollectState(k, chapters, 6), "known", `${k} 应已了解`);
  }
});

test("knownCount 只数读完其章的核心人物", () => {
  assert.equal(knownCount(CORE, chapters, 0), 0);
  assert.equal(knownCount(CORE, chapters, 1), 3); // liubei/guanyu/zhangfei
  assert.equal(knownCount(CORE, chapters, 6), CORE.length);
});

test("事件状态：info / locked / open / cleared", () => {
  assert.equal(eventStatus(undefined, 0), "info"); // 背景事件
  assert.equal(eventStatus(3, 2), "locked");
  assert.equal(eventStatus(3, 3), "open");
  assert.equal(eventStatus(3, 4), "cleared");
});

test("徽章派生：章数 / 指定章 / 人物数", () => {
  assert.equal(badgeEarned({ type: "chaptersAtLeast", n: 6 }, { completedChapters: 5, knownCount: 0 }), false);
  assert.equal(badgeEarned({ type: "chaptersAtLeast", n: 6 }, { completedChapters: 6, knownCount: 0 }), true);
  assert.equal(badgeEarned({ type: "chapterDone", idx: 3 }, { completedChapters: 3, knownCount: 0 }), false);
  assert.equal(badgeEarned({ type: "chapterDone", idx: 3 }, { completedChapters: 4, knownCount: 0 }), true);
  assert.equal(badgeEarned({ type: "peopleKnownAtLeast", n: 3 }, { completedChapters: 0, knownCount: 2 }), false);
  assert.equal(badgeEarned({ type: "peopleKnownAtLeast", n: 3 }, { completedChapters: 0, knownCount: 3 }), true);
});
