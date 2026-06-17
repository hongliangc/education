# Kidora 生产服务器安装与更新手册

当前生产环境：

| 项目 | 配置 |
| --- | --- |
| 云服务器 | 腾讯云 Lighthouse，广州 |
| 系统 | Ubuntu 24.04 LTS |
| 公网 IP | `1.14.158.167` |
| 域名 | `kidora.cn`、`www.kidora.cn` |
| 部署目录 | `/opt/kidora` |
| 镜像仓库 | Docker Hub 私有仓库 `hlc2012/mlk` |
| 容器 | PostgreSQL、Next.js、Nginx |

生产数据库保存在 Docker 卷 `kidora_pgdata`。更新 Web 镜像不会删除数据库。

## 部署文件

- `Dockerfile`：构建 Next.js 生产镜像。
- `deploy/docker-compose.production.yml`：生产容器栈。
- `deploy/nginx.production.conf`：HTTP 反向代理。
- `scripts/release.sh`：一键发布（构建 linux/amd64 + 直传部署，见场景 D）。
- `scripts/publish-image.sh`：本地构建并推送 Docker Hub。
- `scripts/deploy.sh`：将指定镜像部署到 Lighthouse。
- `app/api/health/route.ts`：健康检查接口。

## 一、首次安装服务器

### 1. 安装 Docker

登录服务器：

```bash
ssh ubuntu@1.14.158.167
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
ALIYUN_APP_ID=
ALIYUN_APP_SECRET=
ALIYUN_REFRESH_TOKEN=
ALIYUN_VIDEO_FOLDER_ID=
ALIYUN_DRIVE_ID=
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

`scripts/release.sh` 把「场景 B」的构建 + 直传部署串成一条命令，自动生成版本号，
默认不依赖 Docker Hub：

```bash
bash scripts/release.sh
```

它依次执行：

1. 生成版本标签 `IMAGE_TAG=$(date +%Y%m%d-%H%M%S)`。
2. 构建当前源码为 `linux/amd64` 镜像（含尚未提交的改动）。
3. 调用 `deploy.sh` 以 `transfer` 模式 SSH 直传镜像、重建容器、等待健康。

常用覆盖：

```bash
IMAGE_TAG=20260617-01 bash scripts/release.sh   # 指定版本号
PUSH_HUB=1 bash scripts/release.sh              # 额外推送 Docker Hub（需先 docker login）
DEPLOY_MODE=pull PUSH_HUB=1 bash scripts/release.sh   # 推 Hub 后服务器直接拉取
```

底层仍是 `publish-image.sh` 和 `deploy.sh`，两者可继续单独使用（场景 A/B/C）。

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

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `DOCKER_IMAGE` | `hlc2012/mlk` | 要部署的镜像名称 |
| `IMAGE_TAG` | `latest` | 要部署的镜像版本；推荐显式指定 |
| `DEPLOY_MODE` | `transfer` | `transfer` 为 SSH 直传；`pull` 为服务器直接拉取 |
| `DEPLOY_HOST` | `ubuntu@1.14.158.167` | SSH 登录地址 |
| `DEPLOY_DIR` | `/opt/kidora` | 服务器部署目录 |
| `HEALTH_URL` | `http://kidora.cn/api/health` | 部署后的公网健康检查地址 |
| `DOCKER_CMD` | `docker` | 本地读取镜像时使用的 Docker 命令 |

也可以将标签作为第一个位置参数：

```bash
bash scripts/deploy.sh 20260613-02
```

推荐使用环境变量写法，含义更清楚：

```bash
DEPLOY_MODE=transfer \
IMAGE_TAG=20260613-02 \
bash scripts/deploy.sh
```

`DEPLOY_MODE=transfer` 的具体步骤：

1. 上传生产 Compose 和 Nginx 配置。
2. 执行本地 `docker image save`。
3. 使用 `gzip` 压缩并通过 SSH 传输。
4. 服务器执行 `docker load`。
5. 使用指定标签重建 Web 容器。
6. 等待容器健康并请求公网健康检查。

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
ssh ubuntu@1.14.158.167
cd /opt/kidora

sudo docker compose \
  -p kidora \
  --project-directory /opt/kidora \
  --env-file .env \
  -f deploy/docker-compose.production.yml \
  ps

sudo docker inspect kidora-web-1 \
  --format 'image={{.Config.Image}} health={{.State.Health.Status}}'

curl -fsS http://127.0.0.1/api/health
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

## 六、回滚

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

## 七、日志与故障排查

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
| 本地构建上下文过大 | 检查 `.dockerignore`，不要打包 `.next`、`node_modules`、worktree 或下载素材 |

## 八、安全要求

- Docker Hub 仓库保持 Private。
- PAT 不写入脚本、Compose、Dockerfile 或 Git。
- 对话、日志或终端历史中暴露过的 PAT 必须撤销并重新生成。
- 本地发布 PAT 使用 Read/Write 权限。
- 服务器拉取 PAT 仅使用 Read-only 权限。
- SSH 密码泄露后立即修改，长期建议改用 SSH 密钥。
- `.env` 和 `.env.production` 权限保持 `600`。
- 配置 HTTPS 后，将 `NEXTAUTH_URL` 和 `NEXT_PUBLIC_APP_URL` 改为 `https://kidora.cn`。

## 九、当前限制

- 当前 Nginx 仅配置 HTTP，HTTPS 尚待接入。
- Dockerfile 启动时使用 `prisma db push --accept-data-loss`，正式生产迁移体系完善后应改为 Prisma migrations。
- 当前为单机部署，更新 Web 容器时会有数秒短暂停机。
