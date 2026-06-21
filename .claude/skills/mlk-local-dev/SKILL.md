---
name: mlk-local-dev
description: Use when running, launching, or smoke-testing the MLK app locally on WSL2 with Windows browser access (跑起来 / 本地跑 / 体验一下 / 打开看看 / start dev / open in browser). NOT for production deployment.
---

# 本地启动 / 部署体验

浏览器访问 **`http://localhost/`**（Docker 栈：nginx :80 → web → Postgres）。
**不是** `next dev` 的 `:3000`——那个跑在 WSL 内、Windows 浏览器一般访问不到，且连的是 SQLite。

直接跑现成脚本（在 WSL 内执行）：

```bash
bash scripts/docker-start.sh        # 启动：起 db+web+nginx，等 web healthy（首次自动构建镜像）
bash scripts/docker-rebuild-web.sh  # 改了代码后重新部署：重建 web 镜像（生产无热更，必须重建）
```

```bash
cmd.exe /c start http://localhost/  # 打开 Windows 浏览器（改完代码记得 Ctrl+F5 硬刷新，bundle 带 hash 缓存）
docker compose ps                   # 看状态     docker compose down  # 停栈
```

## 多端预览（移动端排版）
- 像手机一样交互：`npx playwright open --device="iPhone 13" http://localhost/`（真 WebKit）。
- 多视口批量截图：`node scripts/preview-devices.mjs [url]` → `tmp/preview/`。
- 首次需 `npx playwright install webkit chromium`。⚠️ 全屏/音量/自动播放等 iOS 系统级行为以真机为准（发现网后 iPhone 验）。

## 验证
`curl -s http://localhost/api/health` 返回 `"database":true`、`http://localhost/` 能打开 = 通过。

Last verified against: docker-compose.yml(nginx:80 → web:3000 → postgres) · 2026-06-10
