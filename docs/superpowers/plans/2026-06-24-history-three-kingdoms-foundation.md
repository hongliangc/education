# 上下五千年 · Plan 1：板块骨架 + 三国故事世界 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 MLK 新增「上下五千年」板块入口与三国"时代页"，复用现有故事引擎跑通 6 个三国故事的阅读+理解题+演义/史实对照，并把历史向导精灵接上——交付一个可独立体验、可验证"孩子愿不愿看第二个故事"的故事世界。

**Architecture:** 新模块 `HISTORY` 注册进现有 world 地图（grid + SVG 节点 + `ROUTE_OVERRIDE`），落 `(game)` 路由组。`/history` 时代页用横向竹简朝代条 + 三国故事卡，点击进入现有 `ChapterReader`（阅读→理解题→道理，全复用），章末追加「演义 vs 史实」对照小卡。三国故事是一本 `StoryBook`（id `three-kingdoms`、6 章），只在历史板块出现、不进通用书架；阅读进度复用 `ReadingProgress` + `/api/sessions`。历史向导给 `/api/fairy/chat` 加 `context=history` 的 system prompt 分支。

**Tech Stack:** Next.js 16 App Router、TypeScript strict、Tailwind 4、`next/font/google`、Prisma/Postgres（本计划不改 schema）、node:test 单测。

## Global Constraints

- TypeScript strict，禁止 `any`。
- 样式只用 Tailwind + 复用 `globals.css` 动画与现有组件（`FairyBubble`/`Btn`/`BackButton`/`ChapterReader`）。
- 组件超过 250 行按职责拆分。
- 路由组 `(game)` 有 HUD + 精灵。
- 不直接写 SQL；AI/密钥只在服务端。
- 不覆盖/回滚其他需求的未提交改动。
- 标准验证：`npx tsc --noEmit`；改 API 路由验证未登录 401；改 Agent/Skills/协作规则跑 `bash scripts/check-agent-context.sh`。
- 单测运行：`node --test --experimental-strip-types tests/<file>`（框架 `node:test` + `node:assert/strict`；"wiring" 测试读源文件做正则断言，沿用 `tests/english/wiring.test.ts` 范式）。
- 设计真源：`docs/superpowers/specs/2026-06-24-history-three-kingdoms-design.md`。

---

## File Structure

- `content/storybooks/types.ts` — 修改：`Chapter` 加可选 `historyNote`、`cardKeys`。
- `content/history/dynasties.ts` — 新建：朝代条数据（仅三国 active）。
- `content/storybooks/three-kingdoms.ts` — 新建：三国 `StoryBook`（6 章）。
- `lib/utils.ts` — 修改：`MODULES`/`MODULE_META` 加 `HISTORY`。
- `app/(game)/world/page.tsx` — 修改：SVG 节点 + `ROUTE_OVERRIDE` 加 `HISTORY`。
- `app/(game)/history/page.tsx` — 新建：三国时代页（client）。
- `components/history/DynastyRail.tsx` — 新建：竹简卷轴朝代条。
- `components/history/StoryCardRow.tsx` — 新建：6 故事卡行。
- `components/history/ThreeKingdomsReader.tsx` — 新建：选章 + 复用 `ChapterReader` 播放 + 上报。
- `components/history/HistoryNoteCard.tsx` — 新建：演义/史实对照小卡。
- `app/layout.tsx` — 修改：加 `Noto_Serif_SC` 字体变量 `--font-history`。
- `app/globals.css` — 修改：朝代卷轴展开动画 + 字体工具类。
- `lib/fairy/historyPrompt.ts` — 新建：历史向导 system prompt。
- `app/api/fairy/chat/route.ts` — 修改：`context==="history"` 时切 prompt。
- `tests/history/*.test.ts` — 新建：内容校验 + 接线测试。

---

## Task 1: Chapter 类型扩展（historyNote / cardKeys）

**Files:**
- Modify: `content/storybooks/types.ts`
- Test: `tests/history/chapter-types.test.ts`

**Interfaces:**
- Produces: `Chapter.historyNote?: { romance: string; history: string }`；`Chapter.cardKeys?: string[]`（后续 Plan 2 消费 cardKeys）。

- [ ] **Step 1: 写失败测试**

```ts
// tests/history/chapter-types.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("Chapter 类型新增 historyNote / cardKeys 可选字段", () => {
  const src = readFileSync("content/storybooks/types.ts", "utf8");
  assert.match(src, /historyNote\?:\s*\{\s*romance:\s*string;\s*history:\s*string\s*\}/);
  assert.match(src, /cardKeys\?:\s*string\[\]/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/chapter-types.test.ts`
Expected: FAIL（断言不匹配）。

- [ ] **Step 3: 改类型（向后兼容，全可选）**

在 `content/storybooks/types.ts` 的 `Chapter` 接口内、`images?` 之后追加：

```ts
  // 演义 vs 史实 轻量对照（章末小卡）；缺省则不渲染对照卡
  historyNote?: { romance: string; history: string };
  // 该章涉及的人物卡 key（Plan 2 群英谱消费：读完点亮"相识"，章末题答对升"了解"）
  cardKeys?: string[];
```

- [ ] **Step 4: 运行确认通过 + 全量类型检查**

Run: `node --test --experimental-strip-types tests/history/chapter-types.test.ts`
Expected: PASS。
Run: `npx tsc --noEmit`
Expected: 退出码 0（现有书未用新字段，向后兼容）。

- [ ] **Step 5: 提交**

```bash
git add content/storybooks/types.ts tests/history/chapter-types.test.ts
git commit -m "feat(history): Chapter 增 historyNote/cardKeys 可选字段"
```

---

## Task 2: 朝代条数据

**Files:**
- Create: `content/history/dynasties.ts`
- Test: `tests/history/dynasties.test.ts`

**Interfaces:**
- Produces: `export interface Dynasty { key: string; name: string; active: boolean }`；`export const DYNASTIES: Dynasty[]`（恰一个 `active:true`，key 为 `three-kingdoms`）。

- [ ] **Step 1: 写失败测试**

```ts
// tests/history/dynasties.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { DYNASTIES } from "../../content/history/dynasties.ts";

test("朝代条覆盖远古到近现代，且仅三国 active", () => {
  assert.ok(DYNASTIES.length >= 8, "至少 8 个朝代段");
  const active = DYNASTIES.filter((d) => d.active);
  assert.equal(active.length, 1);
  assert.equal(active[0].key, "three-kingdoms");
  const keys = DYNASTIES.map((d) => d.key);
  assert.equal(new Set(keys).size, keys.length, "key 唯一");
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/dynasties.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3: 写数据**

```ts
// content/history/dynasties.ts
// 朝代条数据：第一期仅"三国"可进入，其余为"敬请期待"占位。纯数据，无 React。
export interface Dynasty {
  key: string;
  name: string;
  active: boolean; // 是否可进入（第一期仅 three-kingdoms）
}

export const DYNASTIES: Dynasty[] = [
  { key: "prehistoric", name: "远古", active: false },
  { key: "xia-shang-zhou", name: "夏商周", active: false },
  { key: "spring-autumn", name: "春秋战国", active: false },
  { key: "qin-han", name: "秦汉", active: false },
  { key: "three-kingdoms", name: "三国", active: true },
  { key: "sui-tang", name: "隋唐", active: false },
  { key: "song-yuan", name: "宋元", active: false },
  { key: "ming-qing", name: "明清", active: false },
  { key: "modern", name: "近现代", active: false },
];
```

- [ ] **Step 4: 运行确认通过**

Run: `node --test --experimental-strip-types tests/history/dynasties.test.ts`
Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add content/history/dynasties.ts tests/history/dynasties.test.ts
git commit -m "feat(history): 朝代条数据（仅三国可进入）"
```

---

## Task 3: 模块注册 + world 地图接线

**Files:**
- Modify: `lib/utils.ts:18-28`
- Modify: `app/(game)/world/page.tsx`（`NODES` 与 `ROUTE_OVERRIDE`）
- Test: `tests/history/wiring.test.ts`

**Interfaces:**
- Consumes: `MODULES`/`MODULE_META`/`ModuleId`（Task 自身扩展）。
- Produces: `MODULE_META.HISTORY`；world 中 `HISTORY: "/history"` 路由跳转。

- [ ] **Step 1: 写失败测试**

```ts
// tests/history/wiring.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { MODULES, MODULE_META } from "../../lib/utils.ts";

test("HISTORY 模块已注册并带中文标签", () => {
  assert.ok((MODULES as readonly string[]).includes("HISTORY"));
  assert.equal(MODULE_META.HISTORY.label, "上下五千年");
});

test("world 地图把 HISTORY 路由到 /history 且有 SVG 节点", () => {
  const src = readFileSync("app/(game)/world/page.tsx", "utf8");
  assert.match(src, /HISTORY:\s*"\/history"/);
  assert.match(src, /id:\s*"HISTORY"/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/wiring.test.ts`
Expected: FAIL。

- [ ] **Step 3: 注册模块**

`lib/utils.ts` 改 `MODULES` 数组并补 `MODULE_META`：

```ts
export const MODULES = ["WRITING", "ALPHABET", "WORDS", "MATH", "STORY", "LITERATURE", "HISTORY"] as const;
```

`MODULE_META` 末尾（`LITERATURE` 之后）加：

```ts
  HISTORY:    { label: "上下五千年", emoji: "🏯", color: "#2E8B6B" },
```

- [ ] **Step 4: world 接线**

`app/(game)/world/page.tsx`：
1. `NODES` 数组在 `STORY` 节点后、`theater` 之前加一个历史节点（坐标避让现有节点）：

```ts
  { kind: "module", id: "HISTORY", x: 700, y: 470 },
```

2. `ROUTE_OVERRIDE` 加一行：

```ts
    HISTORY: "/history",
```

（顶部 grid 由 `MODULES.map` 驱动，新增模块自动出现，无需改 grid。）

- [ ] **Step 5: 运行确认通过 + 类型检查**

Run: `node --test --experimental-strip-types tests/history/wiring.test.ts`
Expected: PASS。
Run: `npx tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 6: 提交**

```bash
git add lib/utils.ts "app/(game)/world/page.tsx" tests/history/wiring.test.ts
git commit -m "feat(history): 注册 HISTORY 模块并接入 world 地图 → /history"
```

---

## Task 4: 三国故事内容（StoryBook + 校验测试）

**Files:**
- Create: `content/storybooks/three-kingdoms.ts`
- Test: `tests/history/three-kingdoms-content.test.ts`

**Interfaces:**
- Consumes: `StoryBook`/`Chapter`（含 Task 1 新字段）。
- Produces: `export const THREE_KINGDOMS: StoryBook`（id `three-kingdoms`、kind `novel`、6 章、idx 0-5）。

> 内容真源是 skill `mlk-adapt-classic-story`（改编风格/篇幅/人物标准）。本任务给出**完整骨架 + 第 1 章完整样章 + 校验测试**；其余 5 章在 Step 3b 用该 skill 产出，必须通过同一校验测试。

- [ ] **Step 1: 写失败测试（内容完整性 = 真正的 gate）**

```ts
// tests/history/three-kingdoms-content.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { THREE_KINGDOMS } from "../../content/storybooks/three-kingdoms.ts";

test("三国是一本 6 章 novel，idx 顺序 0-5", () => {
  assert.equal(THREE_KINGDOMS.id, "three-kingdoms");
  assert.equal(THREE_KINGDOMS.kind, "novel");
  assert.equal(THREE_KINGDOMS.chapters.length, 6);
  THREE_KINGDOMS.chapters.forEach((c, i) => assert.equal(c.idx, i));
});

test("每章有正文、2-3 题且答案下标合法、有演义/史实对照与人物卡", () => {
  for (const c of THREE_KINGDOMS.chapters) {
    assert.ok(c.text.trim().length > 0, `${c.title} 正文非空`);
    assert.ok(c.questions.length >= 2 && c.questions.length <= 3, `${c.title} 2-3 题`);
    for (const q of c.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.choices.length, `${c.title} 答案下标合法`);
    }
    assert.ok(c.historyNote && c.historyNote.romance && c.historyNote.history, `${c.title} 有对照`);
    assert.ok(Array.isArray(c.cardKeys) && c.cardKeys.length > 0, `${c.title} 有人物卡`);
  }
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/three-kingdoms-content.test.ts`
Expected: FAIL（模块不存在）。

- [ ] **Step 3a: 写骨架 + 第 1 章完整样章**

```ts
// content/storybooks/three-kingdoms.ts
// 三国故事（第一期 6 章）。改编自公有领域《三国演义》；区分演义与史实。
// 改编风格/篇幅标准 → skill: mlk-adapt-classic-story（唯一真源）。
// 只在历史板块出现，不进 content/storybooks/index.ts 的通用书架。
import type { StoryBook } from "./types";

export const THREE_KINGDOMS: StoryBook = {
  id: "three-kingdoms",
  title: "三国群英",
  emoji: "🏯",
  author: "根据公有领域《三国演义》改编",
  kind: "novel",
  ageBand: "8-10",
  chapters: [
    {
      idx: 0,
      title: "桃园三结义",
      emoji: "🌸",
      text:
        "很久很久以前，天下大乱，到处都不太平。\n" +
        "有三个人在一片开满桃花的园子里相遇了：卖草鞋的刘备、卖枣的关羽、杀猪的张飞。\n" +
        "他们都想做一件大事——让老百姓过上安稳日子。\n" +
        "三个人越聊越投缘，就在桃花树下结为兄弟，约定有福同享、有难同当。\n" +
        "从这一天起，他们一起出发，去闯荡那个乱糟糟的世道。",
      questions: [
        {
          q: "刘备、关羽、张飞在哪里结为兄弟？",
          choices: ["桃园里", "大海边", "学校里"],
          answer: 0,
          explain: "他们在开满桃花的园子里结义，所以叫"桃园三结义"。",
        },
        {
          q: "他们结义时约定了什么？",
          choices: ["谁也不理谁", "有福同享、有难同当", "比谁跑得快"],
          answer: 1,
          explain: "结义就是约定像亲兄弟一样，一起面对好事和难事。",
        },
      ],
      moral: "真正的伙伴，会为了同一个目标并肩努力。",
      historyNote: {
        romance: "《三国演义》写他们在桃园摆下香案、结为生死兄弟，场面很隆重。",
        history: "史书没有"桃园结义"的记载，但刘关张三人关系确实非常亲密，情同兄弟。",
      },
      cardKeys: ["liubei", "guanyu", "zhangfei"],
    },
    // —— 余下 5 章见 Step 3b（用 mlk-adapt-classic-story 产出，遵循同一结构）——
  ],
};
```

- [ ] **Step 3b: 用 skill 产出其余 5 章**

调用 skill `mlk-adapt-classic-story`，按上面同一 `Chapter` 结构补全 idx 1-5：
1. 三顾茅庐（cardKeys: `["liubei","zhugeliang"]`）
2. 草船借箭（cardKeys: `["zhugeliang","zhouyu","lusu"]`）
3. 赤壁之战（cardKeys: `["zhouyu","huanggai","caocao"]`）
4. 空城计（cardKeys: `["zhugeliang","simayi"]`）
5. 七擒孟获（cardKeys: `["zhugeliang","zhaoyun"]`）

每章必须含：`text`（\n 分段儿童改编）、2-3 题（`answer` 下标合法）、`moral`、`historyNote.{romance,history}`、`cardKeys`。cardKey 取值范围与 Plan 2 的 12 卡一致：`liubei guanyu zhangfei zhugeliang zhaoyun caocao simayi zhangliao sunquan zhouyu lusu huanggai`。

- [ ] **Step 4: 运行确认通过 + 类型检查**

Run: `node --test --experimental-strip-types tests/history/three-kingdoms-content.test.ts`
Expected: PASS（6 章全部满足）。
Run: `npx tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 5: 提交**

```bash
git add content/storybooks/three-kingdoms.ts tests/history/three-kingdoms-content.test.ts
git commit -m "feat(history): 三国故事内容 6 章（含演义/史实对照与人物卡映射）"
```

---

## Task 5: /history 时代页（朝代条 + 故事卡 + 复用 ChapterReader）

**Files:**
- Create: `app/(game)/history/page.tsx`
- Create: `components/history/DynastyRail.tsx`
- Create: `components/history/StoryCardRow.tsx`
- Create: `components/history/ThreeKingdomsReader.tsx`
- Modify: `app/layout.tsx`（加 `Noto_Serif_SC` → `--font-history`）
- Modify: `app/globals.css`（朝代展开动画 + `.font-history` 工具类）
- Test: `tests/history/page-wiring.test.ts`

**Interfaces:**
- Consumes: `DYNASTIES`、`THREE_KINGDOMS`、`ChapterReader`（`{ chapter, onChapterComplete }`）、`SessionResult`。
- Produces: `/history` 可阅读三国 6 章，章节顺序解锁；阅读完成上报 `/api/sessions` + `/api/reading/[childId]`。

- [ ] **Step 1: 写接线测试**

```ts
// tests/history/page-wiring.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("/history 页装配朝代条、故事卡、复用 ChapterReader", () => {
  const page = readFileSync("app/(game)/history/page.tsx", "utf8");
  assert.match(page, /DynastyRail/);
  assert.match(page, /ThreeKingdomsReader|StoryCardRow/);
  const reader = readFileSync("components/history/ThreeKingdomsReader.tsx", "utf8");
  assert.match(reader, /ChapterReader/);
  assert.match(reader, /\/api\/sessions/);
});

test("注入历史展示字体变量 --font-history", () => {
  const layout = readFileSync("app/layout.tsx", "utf8");
  assert.match(layout, /Noto_Serif_SC/);
  assert.match(layout, /--font-history/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/page-wiring.test.ts`
Expected: FAIL。

- [ ] **Step 3: 加历史展示字体**

`app/layout.tsx`：在 `ZCOOL_KuaiLe` import 同行扩展并新建实例：

```ts
import { ZCOOL_KuaiLe, Noto_Serif_SC } from "next/font/google";

const historyFont = Noto_Serif_SC({
  weight: "900",
  subsets: ["latin"],
  variable: "--font-history",
  display: "swap",
});
```

`<html>` className 拼上变量：

```tsx
<html lang="zh-CN" className={`${kidFont.variable} ${historyFont.variable} h-full`}>
```

`app/globals.css` 末尾追加：

```css
/* 历史板块：碑刻/史册展示字 */
.font-history { font-family: var(--font-history), serif; }

/* 朝代卷轴展开（进三国页一次性） */
@keyframes scroll-unfurl {
  from { transform: scaleX(0); opacity: 0; }
  to   { transform: scaleX(1); opacity: 1; }
}
.anim-scroll-unfurl { transform-origin: left center; animation: scroll-unfurl 0.5s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .anim-scroll-unfurl { animation: none; }
}
```

- [ ] **Step 4: DynastyRail 组件**

```tsx
// components/history/DynastyRail.tsx
"use client";
import { DYNASTIES } from "@/content/history/dynasties";

export function DynastyRail() {
  return (
    <div className="anim-scroll-unfurl -mx-1 mb-5 flex gap-2 overflow-x-auto px-1 py-1">
      {DYNASTIES.map((d) => (
        <div
          key={d.key}
          className={
            "shrink-0 rounded-xl px-4 py-2 font-history text-lg ring-1 " +
            (d.active
              ? "bg-[#2E8B6B] text-white ring-white shadow"
              : "bg-white/60 text-slate-400 ring-white/60")
          }
          aria-current={d.active ? "true" : undefined}
          title={d.active ? d.name : `${d.name}（敬请期待）`}
        >
          {d.name}
          {!d.active && <span className="ml-1 align-middle text-[10px]">🔒</span>}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: StoryCardRow 组件（选章，顺序解锁）**

```tsx
// components/history/StoryCardRow.tsx
"use client";
import type { Chapter } from "@/content/storybooks/types";

export function StoryCardRow({
  chapters,
  unlockedThrough,
  onPick,
}: {
  chapters: Chapter[];
  unlockedThrough: number; // 已通关章节数：idx <= unlockedThrough 可读
  onPick: (idx: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {chapters.map((c) => {
        const locked = c.idx > unlockedThrough;
        return (
          <button
            key={c.idx}
            disabled={locked}
            onClick={() => onPick(c.idx)}
            className={
              "rounded-2xl p-4 text-left shadow ring-1 ring-white transition " +
              (locked ? "bg-white/40 opacity-60" : "bg-[#F3ECDA] hover:scale-105")
            }
            aria-label={locked ? `${c.title}（未解锁）` : `读 ${c.title}`}
          >
            <div className="text-3xl">{locked ? "🔒" : c.emoji}</div>
            <div className="mt-1 font-history text-base text-[#2B2622]">
              第{c.idx + 1}回 · {c.title}
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 6: ThreeKingdomsReader（复用 ChapterReader + 上报，镜像 literature/read）**

```tsx
// components/history/ThreeKingdomsReader.tsx
"use client";
import { useState } from "react";
import { useGameStore } from "@/store/gameStore";
import { ChapterReader } from "@/components/games/story/ChapterReader";
import { HistoryNoteCard } from "@/components/history/HistoryNoteCard";
import { Btn } from "@/components/Btn";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import type { SessionResult } from "@/components/games/types";

export function ThreeKingdomsReader({
  chapterIdx,
  childId,
  onDone,
}: {
  chapterIdx: number;
  childId: string;
  onDone: () => void;
}) {
  const bumpStars = useGameStore((s) => s.bumpStars);
  const chapter = THREE_KINGDOMS.chapters[chapterIdx];
  const [showNote, setShowNote] = useState(false);

  const onChapterComplete = async (r: SessionResult) => {
    bumpStars(r.starsEarned);
    try {
      await Promise.all([
        fetch("/api/sessions", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            childId,
            module: "HISTORY",
            score: r.score,
            totalQ: r.totalQ,
            correctQ: r.correctQ,
            durationSec: r.durationSec,
            starsEarned: r.starsEarned,
          }),
        }),
        fetch(`/api/reading/${childId}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ bookId: THREE_KINGDOMS.id, chapterIdx }),
        }),
      ]);
    } catch {
      /* 上报失败不阻塞体验 */
    }
    setShowNote(true);
  };

  if (showNote) {
    return (
      <div className="mx-auto max-w-md">
        {chapter.historyNote && <HistoryNoteCard note={chapter.historyNote} />}
        <Btn variant="primary" className="mt-4 w-full" onClick={onDone}>
          回三国时代
        </Btn>
      </div>
    );
  }

  return <ChapterReader key={chapter.idx} chapter={chapter} onChapterComplete={onChapterComplete} />;
}
```

> 实现前先打开 `app/(game)/literature/read/[bookId]/page.tsx` 与 `app/api/reading/[childId]/route.ts` 确认 `/api/sessions`、`/api/reading` 的入参字段名是否与上面一致；以路由实际入参为准（字段名不同则对齐）。

- [ ] **Step 7: /history 页（装配 + 守卫 + 顺序解锁状态）**

```tsx
// app/(game)/history/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { BackButton } from "@/components/BackButton";
import { FairyBubble } from "@/components/fairy/FairyBubble";
import { DynastyRail } from "@/components/history/DynastyRail";
import { StoryCardRow } from "@/components/history/StoryCardRow";
import { ThreeKingdomsReader } from "@/components/history/ThreeKingdomsReader";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";

export default function HistoryPage() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  const [unlockedThrough, setUnlockedThrough] = useState(0);
  const [reading, setReading] = useState<number | null>(null);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
      return;
    }
    (async () => {
      const res = await fetch(`/api/reading/${child.id}`);
      if (res.ok) {
        const j = await res.json();
        const row = (j.progress ?? []).find(
          (p: { bookId: string }) => p.bookId === THREE_KINGDOMS.id,
        );
        setUnlockedThrough(row?.completedChapters ?? 0);
      }
    })();
  }, [child, router]);

  if (!child) return null;

  if (reading !== null) {
    return (
      <main className="min-h-screen px-4 pb-10 pt-20">
        <BackButton onClick={() => setReading(null)} />
        <ThreeKingdomsReader
          chapterIdx={reading}
          childId={child.id}
          onDone={() => {
            setReading(null);
            setUnlockedThrough((n) => Math.max(n, reading + 1));
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 pb-10 pt-20">
      <div className="mx-auto max-w-3xl">
        <FairyBubble text="欢迎来到三国！先听故事，再认识那些大英雄 🏯" mood="excited" />
        <h1 className="mb-3 mt-4 font-history text-2xl text-white drop-shadow">上下五千年</h1>
        <DynastyRail />
        <div className="rounded-3xl bg-white/30 p-4 backdrop-blur ring-1 ring-white/40">
          <div className="mb-2 font-history text-lg text-white drop-shadow">🏯 三国时代 · 故事</div>
          <StoryCardRow
            chapters={THREE_KINGDOMS.chapters}
            unlockedThrough={unlockedThrough}
            onPick={(idx) => setReading(idx)}
          />
        </div>
      </div>
    </main>
  );
}
```

> `/api/reading/[childId]` 的 GET 返回结构（`progress[].completedChapters` / `bookId`）以实际路由为准（见 `app/api/reading/[childId]/route.ts`），字段名不同则在 useEffect 内对齐。

- [ ] **Step 8: 运行测试 + 类型检查 + 启动冒烟**

Run: `node --test --experimental-strip-types tests/history/page-wiring.test.ts`
Expected: PASS。
Run: `npx tsc --noEmit`
Expected: 退出码 0。
Run: `npm run dev`，浏览器开 `/world` → 点「上下五千年」→ 能进 `/history`、读第 1 回、答题、看到对照卡、返回后第 2 回解锁。

- [ ] **Step 9: 提交**

```bash
git add "app/(game)/history/page.tsx" components/history/ app/layout.tsx app/globals.css tests/history/page-wiring.test.ts
git commit -m "feat(history): 三国时代页（朝代条+故事卡+复用 ChapterReader 阅读上报）"
```

---

## Task 6: 演义 vs 史实 对照小卡

**Files:**
- Create: `components/history/HistoryNoteCard.tsx`
- Test: `tests/history/history-note.test.ts`

**Interfaces:**
- Consumes: `Chapter["historyNote"]`（`{ romance: string; history: string }`）。
- Produces: `HistoryNoteCard({ note })`（Task 5 Step 6 已引用）。

- [ ] **Step 1: 写接线测试**

```ts
// tests/history/history-note.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("对照卡渲染演义与史实两栏并带可信度提示", () => {
  const src = readFileSync("components/history/HistoryNoteCard.tsx", "utf8");
  assert.match(src, /note\.romance/);
  assert.match(src, /note\.history/);
  assert.match(src, /演义|史书/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/history-note.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写组件**

```tsx
// components/history/HistoryNoteCard.tsx
"use client";

export function HistoryNoteCard({ note }: { note: { romance: string; history: string } }) {
  return (
    <div className="rounded-3xl bg-[#F3ECDA] p-5 shadow-xl ring-1 ring-[#C9A24B]/40">
      <div className="mb-3 font-history text-lg text-[#2B2622]">📜 故事 vs 史实</div>
      <div className="space-y-3 text-sm text-[#2B2622]">
        <p>
          <span className="font-bold text-[#C2402F]">📖 演义这样写：</span>
          {note.romance}
        </p>
        <p>
          <span className="font-bold text-[#2C4A7E]">📜 史书可能这样：</span>
          {note.history}
        </p>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        小提示：《三国演义》是好看的故事，有些情节是作家想象的，不全是真发生过的事哦。
      </p>
    </div>
  );
}
```

- [ ] **Step 4: 运行确认通过 + 类型检查**

Run: `node --test --experimental-strip-types tests/history/history-note.test.ts`
Expected: PASS。
Run: `npx tsc --noEmit`
Expected: 退出码 0。

- [ ] **Step 5: 提交**

```bash
git add components/history/HistoryNoteCard.tsx tests/history/history-note.test.ts
git commit -m "feat(history): 演义/史实 对照小卡"
```

---

## Task 7: 历史向导精灵（fairy context=history）

**Files:**
- Create: `lib/fairy/historyPrompt.ts`
- Modify: `app/api/fairy/chat/route.ts`
- Test: `tests/history/fairy-history.test.ts`

**Interfaces:**
- Consumes: 现有 `/api/fairy/chat` 请求体（在其中读取 `context`）。
- Produces: `export const HISTORY_GUIDE_PROMPT: string`；当 `context === "history"` 时该 prompt 生效。

> 实现前先读 `app/api/fairy/chat/route.ts`，确认请求体是否已有 `context` 字段、system prompt 如何拼装；按其现有结构插入分支，不要重写整条链路。

- [ ] **Step 1: 写测试**

```ts
// tests/history/fairy-history.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { HISTORY_GUIDE_PROMPT } from "../../lib/fairy/historyPrompt.ts";

test("历史向导 prompt 要求区分史书/演义/传说/争议", () => {
  for (const k of ["史书", "演义", "传说", "争议"]) {
    assert.ok(HISTORY_GUIDE_PROMPT.includes(k), `prompt 含「${k}」`);
  }
});

test("fairy 路由按 context=history 切换历史 prompt", () => {
  const src = readFileSync("app/api/fairy/chat/route.ts", "utf8");
  assert.match(src, /history/);
  assert.match(src, /HISTORY_GUIDE_PROMPT/);
});
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test --experimental-strip-types tests/history/fairy-history.test.ts`
Expected: FAIL。

- [ ] **Step 3: 写历史向导 prompt**

```ts
// lib/fairy/historyPrompt.ts
// 历史向导精灵 system prompt：给 3-10 岁孩子讲历史，必须分清故事与史实。
export const HISTORY_GUIDE_PROMPT = `你是"历史向导"小精灵，陪 3-10 岁的小朋友了解中国历史，重点是三国。
说话要简单、亲切、有趣，每次回答控制在 2-4 句。

最重要的规矩：分清"故事"和"真实历史"。回答时按情况区分并告诉孩子这属于哪一类：
- 史书记载：正史里有记录的；
- 文学演义：《三国演义》等小说里写的、可能是作家想象或夸张的；
- 民间传说：老百姓口口相传的；
- 目前有争议：学者们还没有定论的。

例如孩子问"草船借箭是真的吗"，要说明这是《三国演义》里的精彩情节（文学演义），史书里并没有诸葛亮草船借箭的记载。
不要编造没有依据的"历史事实"，不确定就如实说"这个还不太确定"。`;
```

- [ ] **Step 4: 路由接入分支**

`app/api/fairy/chat/route.ts`：import 该常量，并在读取请求体后、拼 system prompt 处加分支（具体写法对齐该文件现有结构）：

```ts
import { HISTORY_GUIDE_PROMPT } from "@/lib/fairy/historyPrompt";
// ...在解析 body 后：
const systemPrompt = context === "history" ? HISTORY_GUIDE_PROMPT : <现有默认 prompt 变量>;
```

并把 `/history` 页里调用 `FairyChat` 时传入 `context="history"`（若 `FairyChat`/`/api/fairy/chat` 已支持透传 context；否则按其现有 props 对齐）。

- [ ] **Step 5: 运行测试 + 类型检查 + 401 + agent 上下文校验**

Run: `node --test --experimental-strip-types tests/history/fairy-history.test.ts`
Expected: PASS。
Run: `npx tsc --noEmit`
Expected: 退出码 0。
Run: `curl -sI -X POST http://localhost:3000/api/fairy/chat -o /dev/null -w '%{http_code}\n'`
Expected: `401`（未登录）。
Run: `bash scripts/check-agent-context.sh`
Expected: 通过（改了精灵/prompt 链路）。

- [ ] **Step 6: 提交**

```bash
git add lib/fairy/historyPrompt.ts app/api/fairy/chat/route.ts tests/history/fairy-history.test.ts
git commit -m "feat(history): 历史向导精灵 prompt（区分史书/演义/传说/争议）"
```

---

## Self-Review（已核对）

- **Spec 覆盖**：§3 挂载→T3；§4.1 内容文件→T2/T4（cards/trials 属 Plan 2）；§4 Chapter 扩展→T1；§5 故事顺序解锁→T5；§7 演义/史实→T4(数据)+T6(UI)+T7(向导)；§8 视觉(朝代条/字体/绢面)→T5。**群英谱/收集/Prisma 表/卡片 UI/考验/套组（§4.2、§5 三档、§6）→ Plan 2**（本计划不含，故意）。
- **占位符**：无 TBD；内容章节用校验测试作 gate（T4 Step 1 的测试是完整代码）。
- **类型一致**：`Chapter.cardKeys`(T1) 与 T4 cardKeys 取值表一致；`ChapterReader` props、`SessionResult` 字段与源码一致；cardKey 词表（12 个）跨 T4/Plan 2 统一。

## 验证（全计划末尾）

```bash
node --test --experimental-strip-types tests/history/*.test.ts   # 全绿
npx tsc --noEmit                                                  # 退出 0
curl -sI -X POST http://localhost:3000/api/fairy/chat -o /dev/null -w '%{http_code}\n'  # 401
bash scripts/check-agent-context.sh                              # 通过
```

交付里程碑：`/world` 可见「上下五千年」→ 进 `/history` → 竹简朝代条（仅三国可点）→ 读三国 6 回、答理解题、看演义/史实对照、顺序解锁、问历史向导。**群英谱人物卡收集在 Plan 2 叠加。**
