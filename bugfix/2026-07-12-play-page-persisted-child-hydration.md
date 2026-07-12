# 学习页持久化儿童 hydration 竞态

- id: `2026-07-12-play-page-persisted-child-hydration`
- status: done
- commit: this commit

## 现象与复现
- 已登录并选择儿童后，直接打开或刷新 `/play/writing` 会短暂显示汉字页，随后跳回 `/child-select`。
- Playwright 使用包含 Zustand localStorage 的认证态直接进入学习页即可稳定复现。

## 根因
- `PlayPage` 在 Zustand persist 完成 hydration 前读到 `activeChild === null`，提前执行重定向；hydration 后虽然恢复儿童状态，已经排队的重定向仍会发生。

## 修复
- 等待持久化 store 完成 hydration 后，才判断是否缺少儿童并重定向。

## 回归测试
- `e2e/hanzi-learning.spec.ts` 使用真实登录认证态直接打开 `/play/writing`，并完成整轮汉字校验。

## 验证
- 隔离 PostgreSQL、真实 NextAuth 登录与持久化儿童认证态下，Playwright setup 和汉字完整题组测试 2/2 通过。
- 浏览器 `pageerror` 为空，未发生 SSR 错误或客户端回退。
- `npx tsc --noEmit`：通过。
