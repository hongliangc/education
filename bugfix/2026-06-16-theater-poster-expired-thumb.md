# 视频影院部分海报空白（什么都不显示）

- id: `2026-06-16-theater-poster-expired-thumb`
- status: verified
- commit: pending

## 现象与复现
- 视频影院浏览页部分资源海报区域全空（深灰块，连占位 🎞️ 都没有）。
- 复现：打开影院页停留 / 懒加载滚动到较靠后的卡片，超过约 15 分钟后再渲染的海报会变空白；或目录缓存 TTL 配置较大时更易出现。

## 根因
- 阿里云盘 `thumb` 是 OSS 签名 URL，带 `x-oss-expires`，有效期固定 **900 秒（15 分钟）**。
- 关键：OpenList 对 `fs/list`（`refresh:false`，目录缓存命中时）和 `fs/get` 都返回**缓存里的旧 thumb**，往往已经过期；`fs/get` 即使带 `refresh:true` 也不会重签。只有 `fs/list refresh:true` 才强制阿里云重新签发新 thumb。
- 目录缓存 `OPENLIST_CATALOG_TTL_SEC` 默认 600 秒，海报代理 `/api/videos/[id]/poster` 原先直接取 build 时（`refresh:false`）抓到的 `thumbUrl` 去拉图——这个 URL 在 build 当下就可能已经是过期缓存。
- 被代理的 thumb 过期时阿里云返回 403 → 代理报错 → `<img>`（无 onError）显示空白深灰块。小猪佩奇第 13 集即此现象。
- 实测：`fs/get`（含 `refresh:true`）取到的 thumb `x-oss-expires` 仍是过期值（ep13 实测 now-691s，拉取 403 "Request has expired"）；同一文件改用 `fs/list refresh:true` 重新列目录后，thumb `x-oss-expires = now+901s`，服务端拉取 200 image/jpeg。

## 修复
- 根因修复：海报路由不再代理 build 缓存里可能过期的签名 URL。`lib/openlist/client-core.ts` 的 `list(path, refresh)` 新增 `refresh` 参数；`lib/video/catalog.ts` 新增 `getFreshThumbUrl(entry)`：按文件所在目录做一次 `fs/list refresh:true`（强制重签），把目录内文件名→新 thumb 的映射缓存约 180 秒（`OPENLIST_THUMB_TTL_SEC`），同分类整页卡片只触发一次重列。海报路由改用 `getFreshThumbUrl` + `getExternalImage` 代理这个秒级新鲜的 URL。`thumbUrl` 仅作为"该文件有缩略图"的存在性标记，决定是否暴露 posterUrl。
- （废弃方案）曾尝试 `getThumbResponse` 经 `fs/get` 现场重签——实测 `fs/get` 不重签、返回旧缓存 thumb，无效，已移除。
- 纵深防御：`TheaterPosterCard` / `TheaterHero` 的 `<img>` 加 `onError` 回退到 🎞️ 占位 / 渐变背景，任何拉取失败都不再出现纯空白。

## 回归测试
- `tests/video/openlist-client.test.ts`：新增一例验证 `list(path, true)` 把 `refresh:true` 透传给 `fs/list`、默认 `list(path)` 为 `refresh:false`（移除了原 `getThumbResponse` 两例，方法已删除）。
- 全量：`node --test 'tests/video/*.test.ts'` → 36/36 通过；`npx tsc --noEmit` 无错误。

## 验证
- 实测：`fs/get`（含 refresh）返回的 ep13 thumb `x-oss-expires` 为过期值（now-691s）拉取 403；`fs/list refresh:true` 重列后 `now+901s` 拉取 200 image/jpeg。
- 预览（:3001，复用 live db + 外部 OpenList）：`GET /api/videos/<id>/poster` 未登录 401；`GET /theater` 未登录 307；容器 healthy。海报观感由用户在 :3001 目视确认。
