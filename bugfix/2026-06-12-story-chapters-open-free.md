# 西游记章节直接打开，未提示用小星星兑换

- id: `2026-06-12-story-chapters-open-free`
- status: done
- commit: this commit

## 现象与复现
- 进入「西游记（儿童版）」，点击任意章节直接进入阅读播放，不弹「使用小星星兑换」对话框；期望付费章节点击后提示 `⭐5` 兑换。
- 复现：体验环境（Docker）登录孩子 → 故事 → 西游记 → 点第 2 章及以后 → 直接开始阅读，无兑换提示。

## 根因
- 平台 `STORY_CHAPTER` / `STORY_TALE` 的 `rewardResource` 记录只由手动脚本 `scripts/sync-reward-resources.mjs` 写入；该脚本不在 Docker 启动流程里（boot 仅 `prisma db push`），且生产 runner 镜像未拷贝 `scripts/`、`content/`、`lib/` 源码，根本无法在容器内运行。
- 于是运行库里没有故事资源行，`getChildRewardCatalog` 的 `idFor(...)` 返回 `null`，章节 `resourceId` 为空。
- 书页 `handleChapterClick` 的兜底分支 `if (!cat?.resourceId)` 把「未同步资源」当作可直接免费打开，于是付费章节被免费播放。
- 本分支 `f707cff`（#2 去除按序解锁）把章节 1+ 从 `available:false`（🔒先解锁上一章）改为全部可点，揭开了这条原本被门控遮住的免费路径。新加入的书（文学模块等）也都有同样隐患。

## 全场景审计（用户要求复查所有「用小星星兑换」场景）
- STORY_CHAPTER（西游记等长篇）：🔴 本 bug。
- STORY_TALE（短篇故事）：🔴 同一路径同一缺陷（目录构建 + `[bookId]` 页逻辑一致，默认价 8）。同一修复覆盖。
- VIDEO：✅ 正常。`app/api/videos/[id]/unlock/route.ts` 在兑换前 `upsertVideoResource` 懒创建资源；`play` 路由用 `isVideoUnlocked` 强制 403。无免费旁路。
- REWARD（商店）：✅ 正常。奖励由家长/管理端显式创建，目录只列已存在的 REWARD 行，兑换用真实 `resourceId`，无免费兜底。

## 修复
- 新增 `lib/rewards/story-resources.ts`（纯函数 `storyResourceSpecs`，复用 `planMigration` 派生平台 STORY_CHAPTER/STORY_TALE 资源规格，可被 node 测试加载）。
- 新增 `lib/rewards/ensure-resources.ts`（server-only `ensurePlatformStoryResources()`，按进程 memo 化，`createMany skipDuplicates` 幂等补齐资源行）。
- `lib/rewards/catalog.ts`：`getChildRewardCatalog` 在校验 child 后、读取资源前 `await ensurePlatformStoryResources()`，自愈——任何被目录列出的故事章节/短篇都拿到真实 `resourceId`，付费章节走兑换对话框而非免费兜底。
- 对齐 VIDEO 既有「兑换前确保资源存在」模式；不再依赖只能手动跑、且生产镜像无法运行的 `scripts/sync-reward-resources.mjs`。

## 回归测试
- `tests/rewards/story-resources.test.ts`：断言每个章节/短篇都派生出可兑换资源，首章价 0、后续章价 `DEFAULT_CHAPTER_COST`、短篇价 `DEFAULT_TALE_COST`，且只产出 STORY_* 类型。

## 验证
- `npx tsc --noEmit` 通过。
- rewards 套件 33/33 通过（含新增 `story-resources.test.ts`）；唯一失败的 `tests/speech/chunking.test.ts` 与本改动无关（预先存在，未触及）。
- Live（Docker `education` 栈重建后，web healthy `database:true`）：用真实 `storyResourceSpecs` 对生产库执行同一 `createMany`，库内平台资源从 0 → 16（西游记 STORY_CHAPTER ×10：首章 0★、其余 5★；短篇 STORY_TALE ×6：8★）；二次执行新增 0（幂等）。`getChildRewardCatalog` 现返回非空 `resourceId`。
- `GET /api/rewards/catalog` 未登录仍 401。
- 待用户在浏览器确认 UI：西游记第 2 章起点击弹「兑换 ⭐5」对话框、星星不足提示「还差 N 颗星星」。
