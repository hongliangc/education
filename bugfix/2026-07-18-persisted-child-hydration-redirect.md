# 刷新游戏页面误跳孩子选择

- id: `2026-07-18-persisted-child-hydration-redirect`
- status: verified
- commit: pending

## 现象与复现
- 已登录且已选择孩子后，直接刷新 `/world`、`/story`、`/shop` 等游戏页面会跳回 `/child-select`。
- 浏览器本地存储中已经存在 `mlk-game-store.activeChild`；页面加载时短暂进入目标页，随后发生错误跳转。

## 根因
- `(game)` 下各客户端页面在 Zustand persist 恢复 `activeChild` 之前即挂载；首次 effect 读到服务端初始值 `null` 后执行了重定向。
- `/play/[module]` 单页已有 hydration 等待逻辑，但其他游戏页面没有统一保护。

## 修复
- 在 `(game)` 路由组布局增加共享 `GameStoreGate`，persist 完成 hydration 后才挂载 HUD 和子页面，避免逐页重复判断。

## 回归测试
- `e2e/game-store-hydration.spec.ts`：等待页面副作用稳定后，刷新世界页仍应停留在 `/world` 并显示地图入口文案。

## 验证
- 回归测试完成红绿验证：修复前稳定跳转到 `/child-select`，修复后 setup + Chromium 共 2/2 通过。
- `npx tsc --noEmit`、`npm run build`、407 个 Node 测试及 `git diff --check` 均通过。
