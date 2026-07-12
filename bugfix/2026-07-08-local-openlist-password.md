# 本地影院 OpenList 密码配置问题

- id: `2026-07-08-local-openlist-password`
- status: done
- commit: pending

## 现象与复现
- 本地部署后影院无法观看。
- 怀疑 OpenList 密码没有配置正确。
- 复现入口：本地 release 栈 `http://localhost/` 进入影院播放视频。

## 根因
- 本地 release 栈的 OpenList 使用新建的 `kidora-local-release_openlistdata` 数据卷，首次启动生成了随机 admin 密码。
- `.env.local` 中使用的是从服务器同步的 `OPENLIST_USERNAME/OPENLIST_PASSWORD` 和 `OPENLIST_VIDEO_ROOT=/video`，因此 web 登录本地 OpenList 时返回 `code:401`。
- 仅重置密码后还不够：本地新数据卷没有服务器 OpenList 的阿里云盘存储配置，`/video` 会返回 `storage not found`。

## 修复
- 将服务器 Docker volume `kidora_openlistdata` 同步到本地 volume `kidora-local-release_openlistdata`，使本地 OpenList 使用同一套存储配置和管理员凭据。
- 用 `IMAGE_TAG=20260708-231302 bash scripts/deploy.sh local` 重新启动本地 release 栈。

## 回归测试
- OpenList `/api/auth/login` 使用 `.env.local` 凭据返回 `code:200` 且有 token。
- OpenList `/api/fs/list` 列 `/video` 返回 `code:200`，可见视频目录。
- OpenList `/api/fs/other` 对实际视频调用 `video_preview` 返回 `code:200` 且包含 `.m3u8`。

## 验证
- `docker compose --project-name kidora-local-release ps` 显示 db/openlist/web healthy，nginx 监听 `:80`。
- `curl -fsS http://localhost/api/health` 返回 `database:true`、`aiProvider:"deepseek"`。
- `curl -sI http://localhost/theater` 未登录态返回 307 到 `/login?next=%2Ftheater`，路由正常。
