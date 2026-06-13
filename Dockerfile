# 魔法学习王国 — Next.js 16 生产镜像（全栈容器化，roadmap B2）
# 多阶段：deps（装依赖）→ build（prisma generate + next build）→ runner（运行）
# 基础镜像按 digest 固定，避免 node:24-slim 标签漂移导致缓存失效后重新联网构建。
# 升级 Node：docker pull node:24-slim 后用 `docker inspect --format '{{index .RepoDigests 0}}'` 取新 digest 替换。
FROM node:24-slim@sha256:2c87ef9bd3c6a3bd4b472b4bec2ce9d16354b0c574f736c476489d09f560a203 AS base
WORKDIR /app
# Prisma 引擎需要 openssl。Acquire::Retries 让 apt 在瞬时网络抖动时自动重试，避免构建因此失败。
RUN apt-get -o Acquire::Retries=3 update \
 && apt-get -o Acquire::Retries=3 install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
# 构建期占位 env（Prisma generate 不连库；NextAuth 仅运行时用 AUTH_SECRET）
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public"
ENV AUTH_SECRET="build-time-dummy-secret-not-used-at-runtime"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts
EXPOSE 3000
# 启动：先把 schema 推到容器 Postgres（无 migrations，用 db push），再起 Next
CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss && npm run start"]
