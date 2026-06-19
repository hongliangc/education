# 现网 IP 访问被跳转到未备案域名导致打不开

- id: `2026-06-19-prod-ip-redirects-to-unfiled-domain`
- status: done
- commit: this commit

## 现象与复现
- 通过公网 IP `http://119.91.153.49/` 访问现网，会自动跳到 `http://kidora.cn/...`，
  而 `kidora.cn` 未完成 ICP 备案、被腾讯 webblock 拦截，最终访问失败。
- 复现：`bash scripts/release.sh prod`（不设 `PUBLIC_URL`）部署后，浏览器打开 `http://119.91.153.49/`。

## 根因
- `scripts/deploy.sh` 的 prod 分支把 `PUBLIC_URL` 默认成空串（`PUBLIC_URL="${PUBLIC_URL:-}"`）。
- 空串使 `deploy/docker-compose.production.yml` 的插值 `NEXTAUTH_URL: "${PUBLIC_URL:-http://kidora.cn}"`
  落到默认值 `http://kidora.cn`，web 容器拿到 `NEXTAUTH_URL=http://kidora.cn`。
- NextAuth 用该值拼**绝对**跳转（如 `/` → `/login`），所以 IP 访问被跳到 `http://kidora.cn/login`，
  撞上未备案域名的 webblock。`NEXT_PUBLIC_APP_URL` 同理。
- 即默认配置指向了当前不可用的域名；备案完成前 prod 应回落到服务器公网 IP。

## 修复
- `scripts/deploy.sh` prod 分支改为以 `DEPLOY_HOST` 的主机部分派生默认 `PUBLIC_URL`：
  `PUBLIC_URL="${PUBLIC_URL:-http://${DEPLOY_HOST#*@}}"` → 默认 `http://119.91.153.49`。
- 这样 `release.sh prod` 默认即用 IP 拼跳转、IP 访问正常；`HEALTH_URL` 也随之指向 IP。
- 备案完成后显式覆盖即可：`PUBLIC_URL=http://kidora.cn bash scripts/release.sh prod`（或 https）。

## 回归测试
- 无自动化部署测试；通过模拟变量解析链验证（见下）。

## 验证
- `bash -n scripts/deploy.sh` 语法通过。
- 模拟 prod 分支 + compose 插值（不设 `PUBLIC_URL`）：
  `PUBLIC_URL=http://119.91.153.49`、`NEXTAUTH_URL=NEXT_PUBLIC_APP_URL=http://119.91.153.49`、
  `HEALTH_URL=http://119.91.153.49/api/health`——不再回落到 `kidora.cn`。
- 显式覆盖 `PUBLIC_URL=http://kidora.cn` 时 `NEXTAUTH_URL` 正确变回域名（备案后路径不受影响）。
- 现网生效需用户重新 `bash scripts/release.sh prod`（SSH 授权在用户侧）后，浏览器打开
  `http://119.91.153.49/` 确认停留在 IP、不再跳 `kidora.cn`。

