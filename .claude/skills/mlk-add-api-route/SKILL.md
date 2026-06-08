---
name: mlk-add-api-route
description: Use when creating a new Next.js App Router API route (route.ts) in MLK — endpoints needing auth, input validation, Prisma persistence (新 API / 新接口 / 新端点 / 加路由). NOT for editing existing routes or client-side fetching.
---

# 新增 API 路由

## 何时用
- 用户要求新 server 端点（如"加个排行榜接口"、"做一个查家长信息的 API"）
- 修改 schema 后需要新的 CRUD 入口

## 必做清单

1. [ ] 决定 HTTP 方法：GET（读）/ POST（创建）/ PUT（更新）/ DELETE
2. [ ] 决定路径：扁平用 `app/api/<resource>/route.ts`；带 id 用 `app/api/<resource>/[id]/route.ts`
3. [ ] 复制 `templates/route.ts.tmpl` 替换占位符
4. [ ] 必含 4 段：鉴权 → 校验 → 归属检查（涉及 child 时）→ 业务
5. [ ] 错误码遵循约定（见下）
6. [ ] 在客户端调用方加 fetch（同源不用配 cookie，已自动透传）

## 错误码约定

| 状态码 | 含义 | 何时返 |
|---|---|---|
| 200 | 成功 | 正常返回 JSON |
| 400 | 请求错误 | 字段缺失、格式不对、超出范围 |
| 401 | 未鉴权 | `auth()` 返 null |
| 404 | 不存在 | 资源不存在 / 不属于当前用户 |
| 409 | 冲突 | 唯一约束冲突（如重复邮箱注册） |
| 500 | 服务器错误 | try-catch 兜底，不要泄漏 stack |

## 4 种常见模式

### A. GET 列表（受限于当前用户）
```ts
const items = await prisma.child.findMany({
  where: { parentId: session.user.id },
});
return NextResponse.json({ children: items });
```

### B. POST 创建（带校验）
```ts
const name = String(body.name ?? "").trim().slice(0, 16);
if (!name) return NextResponse.json({ error: "请输入名字" }, { status: 400 });
const created = await prisma.child.create({
  data: { parentId: session.user.id, name, age, avatar },
});
return NextResponse.json({ child: created });
```

### C. GET by id（带归属校验）
```ts
const { childId } = await params;
const child = await prisma.child.findFirst({
  where: { id: childId, parentId: session.user.id },
});
if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });
return NextResponse.json({ child });
```

### D. PUT 更新（带乐观锁可选）
```ts
const updated = await prisma.child.update({
  where: { id: childId },
  data: { name: newName },
});
return NextResponse.json({ child: updated });
```

## 客户端调用片段

```ts
const res = await fetch("/api/children", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name, age, avatar }),
});
if (!res.ok) {
  const { error } = await res.json().catch(() => ({}));
  throw new Error(error ?? "请求失败");
}
const data = await res.json();
```

## 反例（不要做）

- ❌ 跳过 `auth()` 检查 — 任何修改 DB 的路由都必须先鉴权
- ❌ 直接信任 `body.childId` — 必须 `parentId === session.user.id` 二次校验
- ❌ `console.log(err)` 把数据库错误返回前端 — 内部错误统一 500 + 短消息
- ❌ 用 `req.url.searchParams` 解析 POST body — POST 用 `req.json()`
- ❌ 返回裸字符串 — 一律 `NextResponse.json({...})`，前端解析一致

## 验证

- 类型检查 + 鉴权 401 冒烟：见 `AGENTS.md` 标准验证（把 `<path>` 换成本路由）。
- 已登录测试（需先获取 cookie）：见 `mlk-local-dev`。

Last verified against: lib/auth.ts · lib/db.ts · 2026-05-27
