# 影院视频问题

- id: `2026-07-07-theater-video-issues`
- status: done
- commit: pending

## 现象与复现
- 三国演义的剧集顺序混乱，应从第 1 集开始。
- 影院缺少手动刷新按钮，无法主动同步云盘视频信息。
- 手机上投屏播放时关闭浏览器或视频后，投屏会中止；需要继续播放并记住上次播放位置。

## 根因
- 云盘目录返回的剧集顺序会被原样映射为默认 `order`，服务端目录构建阶段没有先按集数自然排序，导致三国演义这类合集可出现 `10, 2, 1` 的顺序。
- 影院客户端只在初次进入时拉取 `/api/videos`，没有暴露 `refresh=1` 的手动同步入口。
- 播放器只记录最近播放的视频 id，没有记录每个视频的播放秒数；关闭播放器或页面后再次打开无法从上次位置恢复。

## 修复
- 服务端目录构建在检测到合集集数标记时，先按集数自然升序排列，再分配默认 `order`。
- 影院顶栏新增“同步云盘视频”按钮，调用现有 `/api/videos?refresh=1` 强制同步目录。
- 新增 per-video resume storage；播放中、切集、返回片库和 `pagehide` 时保存位置，重新打开视频时从上次位置恢复；接近开头或结尾时清除恢复点。

## 回归测试
- 新增三国演义乱序目录回归测试。
- 新增每个视频播放位置读写与清理测试。

## 验证
- `node --test tests/video/episode-order.test.ts tests/video/openlist-catalog.test.ts tests/video/resume-storage.test.ts` 通过。
- `node --test tests/video/*.test.ts tests/openlist-video-preflight.test.mjs` 通过。
- `bash scripts/release.sh local` 构建镜像 `hlc2012/mlk:20260708-231302` 并部署本地 production 栈成功。
- Docker 本机已配置与服务器一致的腾讯云 registry mirror，并补充 daemon DNS。
- `docker compose --project-name kidora-local-release ps` 显示 db/openlist/web healthy，nginx 监听 `:80`。
- `curl -fsS http://localhost/api/health` 返回 `database:true`、`aiProvider:"deepseek"`。
- `curl -sI http://localhost/` 返回 307 到 `/login`（未登录态符合预期）。
