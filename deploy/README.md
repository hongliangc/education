# 部署配置（生产 · 大陆自托管）

对应 roadmap 的 **B2 / B6**：[[projects/mlk/plans/2026-05-30-china-launch-roadmap]]
正文：`E:\workspace\knowledge-wiki\wiki\projects\mlk\plans\2026-05-30-china-launch-roadmap.md`

> ⚠️ 这些是**草稿模板**，上线前需替换占位（域名 `yourdomain.com`、路径 `/var/www/mlk`、密钥），
> 且**尚未在真实服务器验证**。

## 文件

- `nginx.conf` — 反向代理 + HTTPS + SSE 缓冲关闭。放到 `/etc/nginx/sites-available/mlk`。
- `ecosystem.config.js` — PM2 进程守护。`pm2 start deploy/ecosystem.config.js`。
- 根目录 `.env.example` — 环境变量清单（生产用 Postgres）。
- `app/api/health/route.ts` — 健康检查 `GET /api/health`（db + AI provider），返回 200/503。

## 首次部署顺序（参考）

1. 服务器装 Node 24 / PM2 / Nginx / PostgreSQL（roadmap B2）。
2. 克隆代码，`npm ci`，配置 `.env`（`DATABASE_URL` 指向 Postgres）。
3. ⚠️ 切 Postgres：把 `prisma/schema.prisma` 的 `datasource provider` 由 `sqlite` 改为 `postgresql`。
4. `npx prisma migrate deploy` → `npm run build`。
5. `pm2 start deploy/ecosystem.config.js && pm2 save && pm2 startup`。
6. 配 Nginx + `sudo certbot --nginx -d yourdomain.com`。
7. 访问 `/api/health` 应返回 200。

## 还没做（roadmap）

- ICP 备案（B3，前置期 ~20 工作日，线下流程）。
- Redis 缓存 / 每日费用告警 / daily-summary 定时任务（B6，脚本待实现）。
- DeepSeek/Qwen 接入实测（需 key）。
