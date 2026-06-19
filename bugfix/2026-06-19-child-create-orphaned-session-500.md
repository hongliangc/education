# 陈旧会话下创建小冒险家报「创建失败」（不透明 500）

- id: `2026-06-19-child-create-orphaned-session-500`
- status: done
- commit: this commit

## 现象与复现
- 本地用 `bash scripts/release.sh local` 部署（全新空 Postgres）后，创建小冒险家报 "⚠ 创建失败"。
- 复现：浏览器残留上一套栈的登录 cookie → 打开 `/child-select` → 新建小冒险家 → 失败。

## 根因
- `lib/auth.ts` 用 `session: { strategy: "jwt" }`：会话只凭签名 cookie 验证，每次请求不查库。
- 本地多次部署用同一默认 `AUTH_SECRET`，旧栈的登录 cookie 在新（空）库下仍然有效，
  放行进入 `/child-select`，但 `session.user.id` 指向的家长在新库中不存在。
- `POST /api/children` 直接 `prisma.child.create({ parentId: session.user.id })`，
  撞 `Child_parentId_fkey` 外键 → 抛 `P2003` → 未捕获 → 500 → 前端兜底显示 "创建失败"。
- 即：陈旧/孤儿会话未被识别，写库失败被包成不透明 500，提示无指向性。

## 修复
- 服务端 `app/api/children/route.ts` POST：建小孩前 `prisma.user.findUnique` 校验家长仍在库中，
  不在则返回 401「登录已失效，请重新登录」，不再让外键错误变成 500。
- 客户端 `app/(game)/child-select/page.tsx`：创建收到 401 时调用已有的
  `signOut({ callbackUrl: "/login" })` 清掉陈旧 cookie 回登录页（直接跳 `/login` 会被中间件
  `proxy.ts` 因 cookie 仍有效弹回 `/child-select`，形成死循环）。

## 回归测试
- `tests/children/orphaned-session.test.ts`（源断言，沿用本仓既有风格）：
  断言 route 在 `child.create` 前用 `prisma.user.findUnique` 校验家长并返回 401；
  断言 child-select 在 401 时调用 `signOut({ callbackUrl: "/login" })`。

## 验证
- `npx tsc --noEmit` 通过；新测试 2/2 通过。
- 未登录 `POST /api/children` → 401（接口改动标准校验）。
- 重建本地栈（镜像 `hlc2012/mlk:20260619-091054`，healthy）后端到端：
  - 有效会话建小孩 → 200，成功创建。
  - 删除家长制造孤儿会话后同一 cookie 再建 → 401 `{"error":"登录已失效，请重新登录"}`，
    不再是不透明 500。

