# Kidora 生产服务器安装与更新手册

当前生产环境：

| 项目 | 配置 |
| --- | --- |
| 云服务器 | 腾讯云 Lighthouse，广州 |
| 系统 | Ubuntu 24.04 LTS |
| 公网 IP | `119.91.153.49` |
| 域名 | `kidora.cn`、`www.kidora.cn` |
| 部署目录 | `/opt/kidora` |
| 镜像仓库 | Docker Hub 私有仓库 `hlc2012/mlk` |
| 容器 | PostgreSQL、Next.js、OpenList、Nginx |

生产数据库保存在 Docker 卷 `kidora_pgdata`。视频影院后端 OpenList 的存储配置（阿里云盘 OAuth token）保存在 Docker 卷 `kidora_openlistdata`。更新 Web 镜像不会删除任一数据卷。

## 部署文件

- `Dockerfile`：构建 Next.js 生产镜像。
- `deploy/docker-compose.production.yml`：生产容器栈。
- `deploy/nginx.production.conf`：HTTP 反向代理。
- `scripts/release.sh`：一键发布（显式选择本地验证或现网发布，见场景 D）。
- `scripts/publish-image.sh`：本地构建并推送 Docker Hub。
- `scripts/deploy.sh`：统一部署脚本（`local` 在本机起栈 / `prod` 上传并部署到 Lighthouse）。
- `app/api/health/route.ts`：健康检查接口。

## 一、首次安装服务器

### 1. 安装 Docker

登录服务器：

```bash
ssh ubuntu@119.91.153.49
```

安装 Docker Engine 和 Compose：

```bash
sudo apt update
sudo apt install -y ca-certificates curl
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo systemctl enable --now docker
sudo docker version
sudo docker compose version
```

腾讯云服务器访问 Docker Hub 公共镜像不稳定时，可配置腾讯云镜像加速：

```bash
sudo mkdir -p /etc/docker
printf '%s\n' \
  '{"registry-mirrors":["https://mirror.ccs.tencentyun.com"]}' |
  sudo tee /etc/docker/daemon.json
sudo systemctl restart docker
```

镜像加速只适用于公共镜像，不能解决 Docker Hub 私有仓库登录和拉取超时。

### 2. 创建部署目录

```bash
sudo mkdir -p /opt/kidora/deploy
sudo chown -R ubuntu:ubuntu /opt/kidora
chmod 700 /opt/kidora
```

### 3. 创建生产环境变量

`/opt/kidora/.env` 保存 Compose 使用的基础密钥：

```bash
cd /opt/kidora
umask 077
POSTGRES_PASSWORD="$(openssl rand -hex 24)"
AUTH_SECRET="$(openssl rand -base64 32 | tr -d '\n')"
printf 'POSTGRES_PASSWORD=%s\nAUTH_SECRET=%s\n' \
  "$POSTGRES_PASSWORD" "$AUTH_SECRET" > .env
chmod 600 .env
```

`/opt/kidora/.env.production` 保存应用服务端密钥：

```bash
cat > /opt/kidora/.env.production <<'EOF'
DEEPSEEK_API_KEY=
TENCENT_SECRETID=
TENCENT_SECRETKEY=
TENCENT_APPID=
TTS_VOICE_ZH=601009
TTS_VOICE_EN=501009
# 视频影院（OpenList 代理阿里云盘）：仅需 OpenList 后台管理员账号。
# 阿里云盘 OAuth token 在 OpenList 后台配置、存进 openlistdata 卷，不在此填写（见 §一·5）。
# OPENLIST_BASE_URL 由 compose 固定为内网 http://openlist:5244，无需在此设置。
OPENLIST_USERNAME=
OPENLIST_PASSWORD=
# 可选：影院视频在 OpenList 中的根路径（默认 /，即整个挂载根）。
# OPENLIST_VIDEO_ROOT=/
EOF
chmod 600 /opt/kidora/.env.production
```

只填写已启用服务的变量。不要将 `.env`、`.env.production` 或 PAT 提交到 Git。

### 4. 首次发布和部署

以下命令都在**本地项目根目录**执行：

```bash
cd /home/ivan/workspace/education
```

#### 步骤 1：登录 Docker Hub

在本地项目目录登录 Docker Hub：

```bash
docker login -u hlc2012
```

密码提示处输入具有 Read/Write 权限的 Docker Hub PAT。看到
`Login Succeeded` 表示登录成功。

#### 步骤 2：生成版本号

建议使用日期和递增序号：

```bash
IMAGE_TAG=20260613-01
```

`IMAGE_TAG` 是本次发布的唯一版本标识。构建和部署必须使用同一个值。

#### 步骤 3：构建并推送镜像

```bash
IMAGE_TAG="$IMAGE_TAG" bash scripts/publish-image.sh
```

该命令会：

1. 读取当前本地工作树，包括尚未提交的代码。
2. 构建 `linux/amd64` 生产镜像。
3. 推送 `hlc2012/mlk:20260613-01`。
4. 同时更新 `hlc2012/mlk:latest`。
5. 在本地保留对应镜像，供 SSH 直传部署使用。

成功时最后一行会输出版本号。

#### 步骤 4：部署本地已有镜像

```bash
IMAGE_TAG="$IMAGE_TAG" bash scripts/deploy.sh
```

此命令**不会构建镜像**。执行前，本地必须存在：

```text
hlc2012/mlk:20260613-01
```

可先检查：

```bash
docker image inspect "hlc2012/mlk:$IMAGE_TAG"
```

`deploy.sh` 默认通过 SSH 将本地镜像直传服务器，因为广州
Lighthouse 直连 Docker Hub 私有 Registry 已验证会超时。

### 5. 配置视频影院后端（OpenList）

视频影院（`/api/videos`）通过同栈的 OpenList 容器代理阿里云盘。首次部署把
OpenList 容器拉起后，需一次性在其后台配置阿里云盘存储；之后 OAuth token 持久化在
Docker 卷 `kidora_openlistdata`，**不进 `.env.production`、镜像或 Git**。

OpenList 仅监听 `127.0.0.1:5244`（公网不可达），通过 SSH 隧道进入后台：

```bash
ssh -L 5244:127.0.0.1:5244 ubuntu@119.91.153.49
```

保持该 SSH 会话，本地浏览器打开 `http://127.0.0.1:5244`。

初始管理员账号在 OpenList 首次启动时随机生成并打印到日志，用户名默认 `admin`：

```bash
sudo docker logs kidora-openlist-1 2>&1 | grep -iE "admin|password"
```

（非首次启动、日志已无初始密码时，可在容器内用 OpenList CLI 重置管理员密码，
见 OpenList 文档。）登录后台后：

1. 「管理 → 存储 → 添加」，驱动选「阿里云盘 Open」，按提示完成 OAuth 授权并挂载
   （例如挂到 `/alipan`）。授权 token 由 OpenList 写入 `openlistdata` 卷，无需手动管理。
2. 把该管理员用户名/密码写入 `/opt/kidora/.env.production`：

   ```text
   OPENLIST_USERNAME=admin
   OPENLIST_PASSWORD=<后台管理员密码>
   ```

3. 若视频不在挂载根，设 `OPENLIST_VIDEO_ROOT`（如 `/alipan`）。
4. 重新部署或重启 web，使其读取新账号：

   ```bash
   IMAGE_TAG=<当前版本> bash scripts/deploy.sh
   ```

验证：`curl -fsS http://127.0.0.1:5244/ping` 确认 OpenList 自身健康；再登录 app 打开
「影院」确认目录加载（影院接口需登录态，未登录直接 `curl /api/videos` 返回 401/302 属正常）。

## 二、日常一键更新

### 场景 A：构建、推送 Docker Hub、部署服务器

这是标准发布流程。每次使用不可变版本标签，不要只依赖 `latest`：

```bash
IMAGE_TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE_TAG="$IMAGE_TAG" bash scripts/publish-image.sh
IMAGE_TAG="$IMAGE_TAG" bash scripts/deploy.sh
```

三行命令分别表示：

1. 生成版本号，例如 `20260613-162530`。
2. 构建镜像，并推送版本标签与 `latest` 到 Docker Hub。
3. 将刚构建的本地镜像通过 SSH 直传服务器并更新容器。

完整流程如下：

1. 本地构建 `linux/amd64` 镜像。
2. 推送 `<版本标签>` 和 `latest` 到 `hlc2012/mlk`。
3. 将指定版本镜像通过 SSH 压缩传输到服务器。
4. 服务器执行 `docker load`。
5. Compose 重建 Web 容器，保留 PostgreSQL 数据卷。
6. 等待 Web 容器健康。
7. 请求 `http://kidora.cn/api/health` 验证公网服务。

如果本地尚未构建镜像，`deploy.sh` 会失败，不会自动从源码构建。

### 场景 B：Docker Hub 不可用，本地构建后直接部署

此流程完全不依赖 Docker Hub：

```bash
# 1. 生成本次部署标签。
IMAGE_TAG="$(date +%Y%m%d-%H%M%S)"

# 2. 将当前本地源码构建成服务器可运行的 linux/amd64 镜像。
docker build \
  --platform linux/amd64 \
  -t "hlc2012/mlk:$IMAGE_TAG" \
  .

# 3. 通过 SSH 压缩传输镜像，在服务器 docker load 后更新容器。
DEPLOY_MODE=transfer \
IMAGE_TAG="$IMAGE_TAG" \
bash scripts/deploy.sh
```

成功标志：

- 输出 `Loaded image: hlc2012/mlk:<版本>` 或镜像已存在。
- `kidora-web-1` 状态变为 `healthy`。
- 最后输出 `Deployment healthy`。

### 场景 C：只部署一个已经存在的本地镜像

先检查镜像：

```bash
docker image inspect hlc2012/mlk:20260613-01
```

检查成功后部署：

```bash
IMAGE_TAG=20260613-01 bash scripts/deploy.sh
```

如果检查命令提示 `No such image`，必须先执行场景 A 的
`publish-image.sh`，或场景 B 的 `docker build`。

### 场景 D：一键发布（推荐日常使用）

`scripts/release.sh` 必须显式选择目标，避免本地验证时误发布到现网。两个目标使用同一个
`DOCKER_IMAGE:IMAGE_TAG` 和同一份 `deploy/docker-compose.production.yml`：

```bash
bash scripts/release.sh local   # 本机用 production compose 跑完整栈
bash scripts/release.sh prod    # 发布到 Lighthouse 现网
```

流程分两段，`local` 与 `prod` 完全复用：

1. **构建**：`release.sh local` 和 `release.sh prod` 调用同一个 `build_image`，生成同一个 `DOCKER_IMAGE:IMAGE_TAG`。
2. **部署**：两者都交给同一个 `scripts/deploy.sh <target>`。`deploy.sh` 按 `target` 渲染**同一组参数**（`PROJECT_NAME`、`DEPLOY_DIR`、`ENV_FILE`、`APP_ENV_FILE`、`PUBLIC_URL`、`HEALTH_URL`、`COMPOSE_SUDO`、`PULL_IF_MISSING`——键相同，仅取值不同），再跑同一个 `scripts/deploy-stack.sh`。`prod` 唯一多出的步骤：先把镜像与非密钥配置（compose / nginx / `deploy-stack.sh`）上传到服务器，并在服务器（而非本机）执行同一个 `deploy-stack.sh`。

本地体验确认无误后，用同一个版本号发布现网：

```bash
IMAGE_TAG=<刚才本地验证的版本号> bash scripts/release.sh prod
```

常用覆盖：

```bash
IMAGE_TAG=20260617-01 bash scripts/release.sh local   # 指定版本号做本地验证
IMAGE_TAG=20260617-01 bash scripts/release.sh prod    # 发布同一版本到现网
PUSH_HUB=1 bash scripts/release.sh prod               # 额外推送 Docker Hub（需先 docker login）
DEPLOY_MODE=pull PUSH_HUB=1 bash scripts/release.sh prod   # 推 Hub 后服务器直接拉取
```

底层 `publish-image.sh` / `deploy.sh` / `deploy-stack.sh` 仍可按职责单独使用；想跳过构建只部署，直接 `bash scripts/deploy.sh {local|prod}`。

## 三、脚本参数

### `scripts/publish-image.sh`

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `DOCKER_IMAGE` | `hlc2012/mlk` | Docker 镜像仓库名称 |
| `IMAGE_TAG` | 当前 UTC 时间 | 版本标签，建议显式指定 |
| `DOCKER_CMD` | `docker` | Docker 命令；特殊环境可设为 `sudo docker` |

示例：

```bash
DOCKER_IMAGE=hlc2012/mlk \
IMAGE_TAG=20260613-02 \
bash scripts/publish-image.sh
```

注意：该脚本始终会推送 Docker Hub。Docker Hub 不可用时，改用场景 B
中的 `docker build`。

### `scripts/deploy.sh`

统一部署脚本，`local` 与 `prod` 同一条路：`bash scripts/deploy.sh {local|prod}`（位置参数为目标，
缺省 `prod`）。按 `target` 渲染同一组参数后跑同一个 `deploy-stack.sh`，`prod` 仅多一步上传。

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| 位置参数 | `prod` | 目标：`local` / `--local` 或 `prod` / `production` / `--prod` / `--production` |
| `DOCKER_IMAGE` | `hlc2012/mlk` | 要部署的镜像名称 |
| `IMAGE_TAG` | `latest` | 镜像版本；推荐显式指定（标签改用此环境变量，不再走位置参数） |
| `DEPLOY_MODE` | `transfer` | 仅 `prod`：`transfer` 为 SSH 直传，`pull` 为服务器直接拉取 |
| `DEPLOY_HOST` | `ubuntu@119.91.153.49` | 仅 `prod`：SSH 登录地址 |
| `DEPLOY_DIR` | `prod=/opt/kidora`、`local=仓库根` | Compose project directory |
| `PUBLIC_URL` | `prod=空`、`local=http://localhost` | 应用公开 URL（影响 NextAuth 跳转与健康检查地址） |
| `LOCAL_ENV_FILE` 等 | 见脚本 | 仅 `local`：覆盖本地渲染的 env 文件 / 项目名 / 公开地址 / dev 密钥 |
| `DOCKER_CMD` | `docker` | 本地读取镜像时使用的 Docker 命令 |

推荐用环境变量写法：

```bash
DEPLOY_MODE=transfer IMAGE_TAG=20260613-02 bash scripts/deploy.sh prod
```

`prod` + `DEPLOY_MODE=transfer` 的具体步骤（local 只有第 6 步，在本机执行）：

1. 上传生产 Compose、Nginx 配置和 `scripts/deploy-stack.sh`。
2. 执行本地 `docker image save`。
3. 使用 `gzip` 压缩并通过 SSH 传输。
4. 服务器执行 `docker load`。
5. 在服务器传入生产参数并执行 `bash scripts/deploy-stack.sh`。
6. `deploy-stack.sh` 使用指定标签重建 Web 容器，等待健康并请求公网健康检查。

### `scripts/release.sh`

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| 位置参数 | 无 | 必填：`local` / `--local` 或 `prod` / `production` / `--prod` / `--production` |
| `RELEASE_TARGET` | 无 | 可替代位置参数；仍建议命令行显式写目标 |
| `PUSH_HUB` | `0` | 设 `1` 时构建阶段复用 `publish-image.sh` 推送 Docker Hub |
| `DEPLOY_MODE` | `transfer` | 仅 `prod` 使用；传给 `deploy.sh` |

### `scripts/deploy-stack.sh`

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `DOCKER_IMAGE` | `hlc2012/mlk` | 要启动的镜像名称 |
| `IMAGE_TAG` | `latest` | 要启动的镜像标签 |
| `PROJECT_NAME` | `kidora` | Compose project 名；本地由 `deploy.sh local` 传 `kidora-local-release` |
| `DEPLOY_DIR` | 当前目录 | Compose project directory；本地是仓库根目录，现网是 `/opt/kidora` |
| `ENV_FILE` | `$DEPLOY_DIR/.env` | Compose `--env-file`，用于 `${...}` 插值 |
| `APP_ENV_FILE` | `$DEPLOY_DIR/.env.production` | Web 服务 `env_file`，注入应用运行时环境变量 |
| `PUBLIC_URL` | 空 | 传给 compose 的应用公开 URL |
| `HEALTH_URL` | `${PUBLIC_URL:-http://kidora.cn}/api/health` | 健康检查地址 |
| `COMPOSE_SUDO` | `0` | 设 `1` 时用 `sudo docker compose`，现网由 `deploy.sh` 传入 |
| `PULL_IF_MISSING` | `0` | 设 `1` 时镜像不存在则 `pull web`，现网由 `deploy.sh` 传入 |
| `DOCKER_CMD` | `docker` | 本地执行 compose 时使用的 Docker 命令 |

推荐发布节奏：

```bash
IMAGE_TAG="$(date +%Y%m%d-%H%M%S)"
IMAGE_TAG="$IMAGE_TAG" bash scripts/release.sh local
IMAGE_TAG="$IMAGE_TAG" bash scripts/release.sh prod
```

## 四、服务器直接拉取

仅当服务器能够稳定访问 Docker Hub 私有 Registry 时使用。

服务器先登录：

```bash
sudo docker login -u hlc2012
```

建议服务器使用单独的 Read-only PAT，本地发布使用 Read/Write PAT。

执行拉取部署：

```bash
DEPLOY_MODE=pull \
IMAGE_TAG=20260613-01 \
bash scripts/deploy.sh
```

若出现以下错误，应改回默认 SSH 直传：

```text
Client.Timeout exceeded while awaiting headers
```

## 五、验证运行状态

本地公网验证：

```bash
curl -fsS http://kidora.cn/api/health
curl -fsSL -o /dev/null -w '%{http_code}\n' http://kidora.cn/
```

服务器检查：

```bash
ssh ubuntu@119.91.153.49
cd /opt/kidora

sudo docker compose \
  -p kidora \
  --project-directory /opt/kidora \
  --env-file .env \
  -f deploy/docker-compose.production.yml \
  ps

sudo docker inspect kidora-web-1 \
  --format 'image={{.Config.Image}} health={{.State.Health.Status}}'

sudo docker inspect kidora-openlist-1 \
  --format 'health={{.State.Health.Status}}'

curl -fsS http://127.0.0.1/api/health
curl -fsS http://127.0.0.1:5244/ping
```

正常健康响应：

```json
{"status":"ok","checks":{"database":true,"aiProvider":"deepseek"}}
```

主机只应公网监听：

- `22`：SSH。
- `80`：HTTP。
- `443`：配置 HTTPS 后使用。

不要公网开放 `3000` 和 `5432`。

## 六、数据库测试操作手册

连库、加测试账号、改孩子星星数、按需把生产数据同步到本地等数据库运维操作，已迁出本部署手册，
详见外部 wiki：`/mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/db-ops-runbook.md`
（Windows：`E:\workspace\knowledge-wiki\wiki\projects\mlk\db-ops-runbook.md`）。

关键约束（迁出后仍需牢记）：

- 本地用 `docker compose up -d db` + `npm run db:studio` 查看；生产只在 SSH 内用同栈 `docker compose ... exec db psql` 操作。
- 改星星要同时更新 `Child.totalStars` 与 `StarLedger`（补一条 `ADMIN_ADJUST`），余额与流水才对得上。
- 生产→本地数据同步是**单向**操作，只覆盖本地测试栈，切勿把本地数据回写生产。

## 七、回滚

查看服务器已有版本：

```bash
sudo docker images hlc2012/mlk
```

如果目标版本仍在本地和服务器：

```bash
IMAGE_TAG=20260613-01 bash scripts/deploy.sh
```

默认模式会再次直传该镜像。也可以在服务器手动切换：

```bash
cd /opt/kidora
sudo env \
  DOCKER_IMAGE=hlc2012/mlk \
  IMAGE_TAG=20260613-01 \
  docker compose \
  -p kidora \
  --project-directory /opt/kidora \
  --env-file .env \
  -f deploy/docker-compose.production.yml \
  up -d web nginx
```

回滚 Web 镜像不会回滚数据库 schema 或业务数据。涉及不兼容 schema 变更时，发布前必须单独制定数据库备份和回滚方案。

## 八、日志与故障排查

查看日志：

```bash
cd /opt/kidora
sudo docker compose \
  -p kidora \
  --project-directory /opt/kidora \
  --env-file .env \
  -f deploy/docker-compose.production.yml \
  logs --tail=100 web nginx db
```

常见问题：

| 现象 | 处理 |
| --- | --- |
| Docker Hub 私有镜像拉取超时 | 使用默认 `DEPLOY_MODE=transfer` |
| Web 一直 `starting` | 查看 Web 日志和数据库健康状态 |
| `/api/health` 返回 503 | 检查 PostgreSQL 容器与 `DATABASE_URL` |
| 域名不可访问 | 检查 DNS、Lighthouse 防火墙和 Nginx |
| 影院 `/api/videos` 报错或目录为空 | 确认 `kidora-openlist-1` 为 `healthy`、`.env.production` 的 `OPENLIST_USERNAME/PASSWORD` 与 OpenList 后台一致、后台阿里云盘存储已挂载（见 §一·5） |
| `http://kidora.cn` 被 302 跳到 `dnspod.qcloud.com/static/webblock.html` | 腾讯对**未备案域名**的 Host 拦截（webblock）。域名需完成 **ICP 备案**才能对外；备案前用公网 IP `http://119.91.153.49/` 直连绕过 |
| 用 IP 访问被跳到 `http://kidora.cn/login`（再被 webblock） | compose 里 `NEXTAUTH_URL` 默认是 `http://kidora.cn`，NextAuth 用它拼**绝对**登录跳转。临时用 IP 体验：部署时设 `PUBLIC_URL`，如 `PUBLIC_URL=http://119.91.153.49 bash scripts/release.sh prod`（compose 用它覆盖 `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL`）；备案后正常部署即恢复域名 |
| 本地构建上下文过大 | 检查 `.dockerignore`，不要打包 `.next`、`node_modules`、worktree 或下载素材 |

## 九、密钥流向（零接触）

部署时密钥**不进 Git、不进镜像、不经过发布脚本传输**。密钥由运行环境本地文件注入：
本地验证使用本地 `LOCAL_ENV_FILE`（默认 `.env.local`，没有则 `.env`），现网使用服务器
`/opt/kidora/.env` 和 `/opt/kidora/.env.production`。

| 文件 | 内容 | 怎么被消费 |
| --- | --- | --- |
| 本地 `.env.local` 或 `.env` | 本地 AI/语音/OpenList 等测试密钥；也可含本地 `DATABASE_URL` | `deploy.sh local` 将其渲染为 `ENV_FILE` / `APP_ENV_FILE` 传给 `deploy-stack.sh`；前者供 compose 变量解析，后者让 web 的 `env_file` 按绝对路径注入容器 |
| `/opt/kidora/.env` | `POSTGRES_PASSWORD`、`AUTH_SECRET` | `deploy.sh` 远端执行 `docker compose --env-file .env`，只用于 `${POSTGRES_PASSWORD}`、`${AUTH_SECRET}` 等 compose 插值 |
| `/opt/kidora/.env.production` | Web 运行时密钥：`DEEPSEEK_API_KEY`、`TENCENT_SECRETID/SECRETKEY/APPID`、`OPENLIST_*` 等 | production compose 的 `web.env_file` 默认读取 `.env.production`，把这些变量注入 web 容器进程环境 |

### 注入链路

```text
本地验证:
  .env.local / .env
    ├─ deploy.sh local -> deploy-stack.sh: ENV_FILE=<本地 env 文件>
    │    └─ compose 解析 ${...} 插值
    └─ deploy.sh local -> deploy-stack.sh: APP_ENV_FILE=<本地 env 文件绝对路径>
         └─ web.env_file
              └─ web 容器 process.env
                   └─ Next.js / Prisma / OpenList / AI SDK 读取

现网发布:
  本地源码 ──docker build──▶ 镜像(无密钥)
  本地镜像 ──deploy.sh transfer──▶ 服务器 docker load
  compose.yml + nginx.conf ──scp──▶ /opt/kidora/deploy/

  /opt/kidora/.env
    └─ deploy.sh -> deploy-stack.sh: ENV_FILE=/opt/kidora/.env
         └─ compose 解析 POSTGRES_PASSWORD/AUTH_SECRET/PUBLIC_URL
              └─ DATABASE_URL、AUTH_SECRET 注入 web 容器

  /opt/kidora/.env.production
    └─ deploy.sh -> deploy-stack.sh: APP_ENV_FILE=/opt/kidora/.env.production
         └─ web.env_file
         └─ DEEPSEEK_API_KEY / TENCENT_* / OPENLIST_* 注入 web 容器 process.env

  OpenList 后台配置
    └─ 阿里云盘 OAuth token 写入 kidora_openlistdata 卷
         └─ 项目只用 OPENLIST_USERNAME/PASSWORD 调 OpenList API，不接触阿里 token
```

### 为什么分成 `.env` 和 `.env.production`

- `.env` 只给 Compose 做基础设施插值：数据库密码用于拼容器内 `DATABASE_URL`，`AUTH_SECRET`
  需要被 `environment:` 明确透传给 web。它不适合放大量应用密钥，因为 `deploy.sh` 和 compose
  命令都会显式引用它。
- `.env.production` 只给 web 进程使用：大模型、腾讯云、OpenList 账号由 `env_file` 注入，
  不参与 compose 文件插值，避免把应用密钥写进 compose 或脚本。
- `OPENLIST_BASE_URL` 固定在 compose 的 `environment:` 中，因为它是同栈内网地址
  `http://openlist:5244`，不是密钥，且本地和现网都应一致。
- 阿里云盘 OAuth token 由 OpenList 驱动管理。项目不保存 refresh token，是为了避免 Web 镜像、
  Next.js 日志、Prisma 数据库或发布脚本接触云盘长期凭证。

### 发布工作流中的密钥行为

- `deploy.sh local` 只使用本地文件注入本地容器，不上传、不 SSH、不读取服务器密钥。
- `release.sh prod` 先构建镜像，再调用 `deploy.sh prod`。构建阶段不读取生产 `.env*`。
- `deploy.sh prod` 只 `scp` 三个非密钥文件（`docker-compose.production.yml` + `nginx.production.conf`
  + `deploy-stack.sh`）、传镜像，再在服务器执行 `deploy-stack.sh`。它不读、不传、不写任何 `.env*` 内容。
- `deploy-stack.sh` 启动前显式检查 `ENV_FILE` / `APP_ENV_FILE` 是否存在，缺了直接报错退出
  （`scripts/deploy-stack.sh`），从不创建密钥文件。
- 密钥只在首次安装时手动建一次（§一·3），之后归管理员维护；§十 明令禁止入库。

## 十、安全要求

- Docker Hub 仓库保持 Private。
- PAT 不写入脚本、Compose、Dockerfile 或 Git。
- 对话、日志或终端历史中暴露过的 PAT 必须撤销并重新生成。
- 本地发布 PAT 使用 Read/Write 权限。
- 服务器拉取 PAT 仅使用 Read-only 权限。
- SSH 密码泄露后立即修改，长期建议改用 SSH 密钥。
- `.env` 和 `.env.production` 权限保持 `600`。
- 配置 HTTPS 后，将 `NEXTAUTH_URL` 和 `NEXT_PUBLIC_APP_URL` 改为 `https://kidora.cn`。

## 十一、当前限制

- 当前 Nginx 仅配置 HTTP，HTTPS 尚待接入。
- Dockerfile 启动时使用 `prisma db push --accept-data-loss`，正式生产迁移体系完善后应改为 Prisma migrations。
- 当前为单机部署，更新 Web 容器时会有数秒短暂停机。
