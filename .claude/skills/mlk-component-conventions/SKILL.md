---
name: mlk-component-conventions
description: Use when modifying UI in the Magic Learning Kingdom (魔法学习王国) project — adding buttons, modals, animations, color changes, the fairy sprite, or the HUD. Triggers on "改 UI / 加按钮 / 加弹窗 / 加动画 / 改颜色 / 加精灵 / 加 HUD / UI patterns / animation / button / modal / fairy / styling / kid style". NOT for game-module-specific scaffolding (use mlk-add-game-module). NOT for production deployment styling (use batch D when it exists).
---

# MLK 组件约定

## 何时用
任何对 UI 视觉/交互层的改动，包括：
- 加新按钮、弹窗、HUD 元素
- 调整动画时长或新增动画
- 改颜色（特别是关卡 module 配色）
- 修改精灵表情/位置/对话框
- 加载骨架屏、错误提示样式

## UI 框架选型（自研优先，按需可用外部）

**默认走自研**：儿童端 UI 用本项目自研系统（`Btn` / `GameModal` / `FairySprite` / `anim-*` / Web Audio / Web Speech），保住糖果色可爱风格——shadcn 的中性/暗色 SaaS 审美与之错位。**别为"自研而自研"**。

**按需可用外部**：若某个具体需求点有现成外部组件能**快速上线**、又不破坏可爱风格，就务实地用它，不必硬手搓。判断点 = 「这块是否要可爱定制感」——要 → 自研；偏标准/数据/表单且赶工期 → 可上外部库。

- 明确适合外部的场景：**家长后台 / 后台管理**（SaaS 式数据界面）→ `npx shadcn init` + shadcn/ui + Lucide 图标 + 图表（Recharts/Tremor）；Radix 自带 a11y，组件拷进项目可自由改主题（Tailwind 4 + React 19 + Next 16 用新 CLI）。
- **Framer Motion 暂缓**：现有 CSS `anim-*` 够用；连续状态切换/物理动画/列表 reorder 才上（见下方动画段）。
- 通用过程习惯：先描述"想要的感受"而非点名组件；每个组件补齐 loading / empty / error / hover 四态。

## 颜色令牌

`lib/design-tokens.ts` 导出 `T`，与 Tailwind 4 `@theme inline` 同步：

| key | hex | 典型用途 |
|---|---|---|
| sky1 / sky2 | #bae6fd / #7dd3fc | 天空渐变 |
| grass | #86efac | 草地、成功状态 |
| pink / rose | #f9a8d4 / #fda4af | 写字模块、danger 按钮 |
| yellow / orange | #fde68a / #fdba74 | 算术模块、星星、警告 |
| purple | #c4b5fd | 故事模块 |
| blue | #93c5fd | 字母模块 |
| ink | #1f2937 | 主文本 |
| paper / cream | #fff7ed / #fef3c7 | 卡片背景 |

5 个 module 的颜色固定在 `lib/utils.ts#MODULE_META`：
- WRITING=#f472b6（pink）/ ALPHABET=#60a5fa（blue）/ WORDS=#34d399（green）/ MATH=#fbbf24（yellow）/ STORY=#a78bfa（purple）

## 动画 class（11 个，在 globals.css 定义）

| class | 时长 | 典型用途 |
|---|---|---|
| `anim-float` | 3s infinite | 精灵漂浮、装饰 emoji |
| `anim-bob` | 2s infinite | 轻微上下浮动 |
| `anim-spin-slow` | 6s linear infinite | 缓慢旋转装饰 |
| `anim-pulse-soft` | 2s infinite | 关卡节点呼吸 |
| `anim-pop-in` | 0.35s ease-out | 卡片/弹窗进场 |
| `anim-slide-up` | 0.45s | 表单/提示从下方滑入 |
| `anim-slide-right` | 0.4s | 列表项从右滑入 |
| `anim-shake` | 0.3s | 错误抖动 |
| `anim-correct` | 0.45s | 答对脉冲（绿色背景） |
| `anim-twinkle` | 1.6s infinite | 星星闪烁 |
| `anim-pulse-soft` | 2s | 强调元素 |

> 何时用 Framer Motion vs 纯 CSS：**单次进场动画用 class**；**连续状态切换 / 物理动画 / 列表 reorder 才上 framer-motion**。本项目目前没用 framer-motion，添加前先确认确实需要。

## `<Btn>` 4 种 variant（`components/Btn.tsx`）

| variant | 颜色 | 用途 |
|---|---|---|
| primary | 粉 (pink) | 主要 CTA（确认、开始、提交） |
| secondary | 蓝 (sky) | 次要操作（注册、切换） |
| danger | 玫红 (rose) | 警告、删除 |
| ghost | 白底 | 第三选项（取消、关闭、跳过） |

每个 variant 自带 3D 按压效果（`active:translate-y-1`），**禁止**用裸 `<button>` 替代。

Size：sm（紧凑）/ md（默认）/ lg（CTA）。

## `<GameModal>`（`components/GameModal.tsx`）

每个游戏模块统一用它包裹：
```tsx
<GameModal title="写字练习" emoji="✏️" color={MODULE_META.WRITING.color} onClose={back}>
  {/* game UI */}
</GameModal>
```

`color` 必须来自 `MODULE_META[moduleId].color`，确保头部条与世界地图节点同色。

## `<FairySprite>` & `<FairyBubble>`

`mood`: `happy` | `thinking` | `excited` | `surprised`
- happy：常态
- thinking：用户停留思考时
- excited：答对/通关
- surprised：错答 / 出现新内容

`<FairyBubble side="left|right">`：左右站位决定头像与气泡顺序。

## 拆分阈值

组件文件 **> 250 行就拆**。当前临界文件：
- `components/games/StoryGame.tsx`（273 行）— 已达上限，新加功能必须先抽子组件

## 反例（不要做）

- ❌ 直接写 `<button>` — 失去 3D 按压、focus ring、disabled 处理
- ❌ 用内联 `style={{ animation: '...' }}` — 用 `anim-*` class 保持一致
- ❌ 颜色硬编码 hex — 用 `lib/design-tokens.ts#T` 或 Tailwind class
- ❌ 给 `<GameModal>` 的 `color` 传随机色 — 必须 `MODULE_META[X].color`
- ❌ 重复造 emoji 装饰组件 — `<CloudBG>` 已包含云、星、草地

## 验证

改完 UI 后：
1. `npx tsc --noEmit` 不报错
2. 浏览器打开对应页面，目测动画流畅度
3. Lighthouse a11y 分数不下降（C 批后会加自动检查）

Last verified against: prisma schema v1 · Next.js 16.2.6 · Tailwind 4 · 2026-05-27
