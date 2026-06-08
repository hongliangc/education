---
name: mlk-add-game-module
description: Use when adding a new interactive learning game module to MLK (新游戏 / 新关卡 / 新玩法 / 加一种游戏 / new game / new module). NOT for adding items to existing modules (→ mlk-add-knowledge-pack).
---

# 新增游戏模块

## 何时用
- 用户要求新增一种交互式学习模块（如"加个找规律的游戏"、"加个拼音听写"）
- 区别于纯题库扩展（那是 `mlk-add-knowledge-pack` 的范围）

## 前置阅读
- [mlk-component-conventions](../mlk-component-conventions/SKILL.md) — Btn、GameModal、动画 class、颜色令牌
- [mlk-audio-speech-recipes](../mlk-audio-speech-recipes/SKILL.md) — 如游戏含音效/朗读

## 必做清单（按顺序）

1. [ ] 在 `lib/utils.ts#MODULES` 数组末尾追加新模块 ID（大写英文，如 `"LOGIC"`）
2. [ ] 在 `lib/utils.ts#MODULE_META` 添加色卡 + emoji + label：
   ```ts
   LOGIC: { label: "找规律", emoji: "🧩", color: "#a3e635" }
   ```
3. [ ] 在 `prisma/schema.prisma` 中 `module String // ...` 的注释列表里追加 `LOGIC`
4. [ ] 新建 `content/<name>.ts`，从 `templates/content.ts.tmpl` 出，至少 10 个题目
5. [ ] 新建 `components/games/<Name>Game.tsx`，从 `templates/Game.tsx.tmpl` 出
6. [ ] 在 `app/(game)/play/[module]/page.tsx#SLUGS` 注册 slug：
   ```ts
   logic: "LOGIC",
   ```
7. [ ] 在同文件 import 新游戏组件，并在 JSX 中添加分支：
   ```tsx
   {slug === "logic" && <LogicGame onComplete={onSessionComplete} />}
   ```
8. [ ] 在 `app/(game)/world/page.tsx#NODES` 添加节点坐标（避开现有 5 个）
9. [ ] 自检：错答调 `sfx.wrong()`，对答调 `sfx.correct()`
10. [ ] 自检：完成时 `onComplete({score, totalQ, correctQ, durationSec, starsEarned})` 五个字段都传

## 文件模板

- `templates/Game.tsx.tmpl` — 通用 4-choice 游戏骨架，替换占位符即可
- `templates/content.ts.tmpl` — 内容数据 shape + generate*Round 助手

替换的占位符：
- `__NAME__` → PascalCase（如 `Logic`）
- `__name__` → lowercase（如 `logic`）
- `__BG_FROM__` / `__BG_TO__` → Tailwind 颜色对
- `__BAR_FROM__` / `__BAR_TO__` → 进度条颜色对
- `__EMOJI_OR_PROMPT__` → 题面渲染

## 反例（不要做）

- ❌ 直接写 `<button>` 而不是 `<Btn>` — 失去 3D 按压效果
- ❌ 在游戏里直接 `fetch('/api/sessions')` — 把 `onComplete` 留给父级 `PlayPage` 处理
- ❌ 把内容数组写在组件内 — 必须放 `content/*.ts`，方便后续 `mlk-add-knowledge-pack` 扩库
- ❌ 用 `setTimeout(speak, 220)` 模拟逐字 — 用 `lib/speech.ts#speakText` 的 `onWord` 回调
- ❌ 错答立即跳下一题 — 必须 700ms 延时让用户看到 anim-shake

## 验证

- 类型检查：见 `AGENTS.md` 标准验证。
- 启动并体验（见 `mlk-local-dev`）：新节点出现、点进能玩一轮；完成一轮后 `/api/progress/[childId]` 应有新 module 的 `LearningProgress` 记录。

Last verified against: prisma schema v1 · Next.js 16.2.6 · 2026-05-27
