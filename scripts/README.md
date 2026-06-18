# scripts/

可复用的项目脚本，随仓库提交。

**分流原则**（来自共享工作树经验）：
- **一次性 / 临时操作**（如某次提交的 `index.lock` 守卫、临时探针）→ 写到 `/tmp` 跑完即弃，**不**进仓库（也避免被并发的另一个 Claude `git add -A` 卷走）。
- **值得反复用**的（docker 运维、数据校验、批处理）→ 放这里、提交，让每个新会话都能直接用。

## 运行环境

项目在 WSL2，docker / node / git 都在 Linux 侧。Windows 上（Claude / PowerShell）调用时走 WSL：

```
wsl -e bash -ic "cd ~/workspace/education && bash scripts/<name>.sh"
```

生产服务器首次安装、日常更新、回滚和故障排查见
[`deploy/README.md`](../deploy/README.md)。

## 现有脚本

- **`docker-rebuild-web.sh`** — 重建并重启 `web` 容器。改了 `app/` `components/` `content/` `lib/` 等代码后用：生产构建无热更，必须重建镜像；完成后浏览器要硬刷新（bundle 带 hash 缓存）。
- **`docker-start.sh`** — 启动完整 Docker 栈，轮询到 `web` 健康后打印容器状态。
- **`docker-stop.sh`** — 停止完整 Docker 栈，但保留容器和数据卷。
- **`docker-restart.sh`** — 重启完整 Docker 栈，轮询到 `web` 恢复健康后打印容器状态。
- **`smoke-health.sh`** — 起 dev server → 轮询 `/api/health` → 打印 health + 日志尾 → 关掉 dev。改完功能做一次性冒烟用。
- **`dev-status.sh`** — 只读现状：dev 日志尾 + `:3000` 端口占用 + curl 可用性。dev 起不来/异常时先跑它看现场。
- **`docker-recreate.sh`** — `docker compose up -d` 后轮询 `education-web-1` 健康状态直到 healthy（约 30s 超时）。容器模式重启栈用。
- **`publish-image.sh`** — 将当前工作树构建为 `linux/amd64` 镜像，并推送版本标签与 `latest` 到 Docker Hub 私有仓库 `hlc2012/mlk`。运行前执行 `docker login -u hlc2012` 并在密码提示处输入 PAT。
- **`deploy-stack.sh`** — 复用的栈启动脚本，不构建、不上传、不判断 local/prod；只读取 `PROJECT_NAME`、`DEPLOY_DIR`、`ENV_FILE`、`APP_ENV_FILE`、`COMPOSE_SUDO` 等参数，启动 `db/openlist/web/nginx` 并验证健康。
- **`deploy.sh`** — 生产上传阶段：上传生产 Compose/Nginx/`deploy-stack.sh`，按 `DEPLOY_MODE` 直传或拉取镜像，然后在 Lighthouse 上传入生产参数执行 `deploy-stack.sh`。
- **`release.sh`** — 显式目标的一键发布入口：本地构建步骤完全复用；`local` 构建后传入本地参数直接执行 `deploy-stack.sh`，`prod` 构建后进入 `deploy.sh` 上传并远端执行同一个 `deploy-stack.sh`。
- **`check-agent-context.sh`** — 检查 Agent 入口文件大小、外部 wiki 路径及废弃的工作流/二级索引是否残留。修改 `AGENTS.md`、`CLAUDE.md` 或 Skills 后运行。
- **`verify-openlist-video.mjs`** — 登录 OpenList，验证阿里云盘 `video_preview` 的 M3U8、首个媒体分片和 CORS；不会打印签名 URL。运行：`npm run videos:verify-openlist`。
  - 首次配置流程及稳定目录格式见 `docs/video/openlist-setup.md`。
- **`sync-reward-resources.mjs`** — 幂等迁移：把历史 `ReadingProgress` / `VideoUnlock` 导入统一奖励系统，并按内容生成平台 `RewardResource` 目录与每个孩子的开账余额（`OPENING_BALANCE`）。可重复运行（资源/开账/永久解锁均按唯一键去重）。`--dry-run` 只打印计划不写库。需要 `DATABASE_URL`；通过 `ts-resolve-hooks.mjs` 加载 `content/storybooks` 的无扩展名 TS 导入。
  - 预演：`node scripts/sync-reward-resources.mjs --dry-run`
  - 应用：`node scripts/sync-reward-resources.mjs`
- **`ts-resolve-hooks.mjs`** — ESM resolve 钩子：把无扩展名的相对导入重试为 `.ts`，让离线 node 脚本能 import 走 Turbopack 打包的内容模块（被 `sync-reward-resources.mjs` 用）。

## 待补（下次需要时直接写成本目录脚本，别再写 `/tmp`）

历史上这些常用运维操作曾以一次性 `/tmp` 脚本反复手搓、脚本随用随删、内容已丢。下次再用到时，**直接在本目录建提交脚本**：

- **`speech-e2e.sh`** — 语音子系统端到端冒烟（TTS / STT 链路）。语音子系统正在改动，定型后再补。
- **`tts-verify.sh`** — TTS 输出校验。
- **`stt-probe.sh`** — STT 探针。

## 新增约定

- shell 脚本：`#!/usr/bin/env bash` + `set -euo pipefail`，`cd "$(dirname "$0")/.."` 回到项目根。
- node 脚本用 `.mjs`；需直接读 `.ts` 内容时 `node --experimental-strip-types scripts/<name>.mjs`，并优先 import 相对路径的内容文件（`@/` 别名 node 解析不了）。
- 每加一个脚本，在上面「现有脚本」补一行用途说明。
