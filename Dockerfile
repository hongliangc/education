# 魔法学习王国 — Next.js 16 生产镜像（全栈容器化，roadmap B2）
# 多阶段：deps（装依赖）→ build（prisma generate + next build）→ runner（运行）
FROM node:24-slim AS base
WORKDIR /app
# Prisma 引擎需要 openssl
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
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
