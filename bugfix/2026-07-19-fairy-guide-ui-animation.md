# 小仙女指导 UI 与动画缺失

- id: `2026-07-19-fairy-guide-ui-animation`
- status: done
- commit: not created (shared dirty worktree; changes kept uncommitted to avoid mixing other work)

## 现象与复现
- 用户反馈小仙女指导 UI 与动画未实现。
- 进入游戏模块页面，检查 `public/ui/mascot/fairy-guide.png` 是否实际显示并提供引导动画与反馈。

## 根因
- 游戏布局只挂载 `HUD`，没有全局小仙女入口或引导层。
- `FairySprite` 仍是旧的手绘 SVG，未使用 `public/ui/mascot/fairy-guide.png`；正式切图目前只在登录、注册和视觉验收夹具中使用。
- `FairyBubble` 只在世界地图、三国和错误页局部调用，因此英语、汉字、数学、词语、故事等模块看不到统一的小仙女指导。

## 修复
- 在 `(game)` 布局挂载唯一的 `FairyGuideProvider`，提供统一入口、提示气泡和现有 `FairyChat`。
- `FairySprite` 改为使用正式切图 `/ui/mascot/fairy-guide.png`，补充进入和轻浮动动画及 reduced-motion 支持。
- 建立 `enter / hint / correct / incorrect / complete` 五类事件契约，并在英语、汉字、词语、数学、故事、文学和历史的现有学习分支接入。
- 专属聊天打开、故事/文学阅读以及视频播放期间自动避让或隐藏常驻入口，避免双精灵和底部控制遮挡。
- 同步修正截图发现的模块首屏层级、故事/文学插画回退、影院标题对比度、历史 CTA 与商店空状态。

## 回归测试
- `node --experimental-strip-types --test tests/ui/fairy-guide.test.ts tests/ui/key-screen-reference.test.ts`：23 项通过（小仙女契约单文件 16 项通过）。
- `npx tsc --noEmit`：通过。
- `npm run build`：通过；发布脚本内生产构建再次通过。
- `E2E_BASE_URL=http://localhost npx playwright test e2e/ui-foundation.spec.ts e2e/core-child-ui.spec.ts e2e/subject-child-ui.spec.ts e2e/world-island-spacing.spec.ts --project=chromium --no-deps`：18/18 通过。

## 验证
- 最终本地镜像：`hlc2012/mlk:20260719-235930`，`kidora-local-release-web-1` healthy。
- `curl -sI http://localhost` 返回 `HTTP/1.1 307 Temporary Redirect`，符合鉴权入口预期。
- 桌面/手机共 36 个路由截图与指标：`/tmp/mlk-ui-audit/`；无横向溢出、无 console warning/error。
- 关键交互结果：`/tmp/mlk-ui-audit/interactions.json`；精灵开关、汉字目录、历史长卷、影院搜索均通过。
