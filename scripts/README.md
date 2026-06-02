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

## 现有脚本

- **`docker-rebuild-web.sh`** — 重建并重启 `web` 容器。改了 `app/` `components/` `content/` `lib/` 等代码后用：生产构建无热更，必须重建镜像；完成后浏览器要硬刷新（bundle 带 hash 缓存）。

## 新增约定

- shell 脚本：`#!/usr/bin/env bash` + `set -euo pipefail`，`cd "$(dirname "$0")/.."` 回到项目根。
- node 脚本用 `.mjs`；需直接读 `.ts` 内容时 `node --experimental-strip-types scripts/<name>.mjs`，并优先 import 相对路径的内容文件（`@/` 别名 node 解析不了）。
- 每加一个脚本，在上面「现有脚本」补一行用途说明。
