<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — 魔法学习王国 (Magic Learning Kingdom)

> 项目事实的**单一真源**：Claude Code 经 CLAUDE.md 的 `@AGENTS.md` 读取，Codex（`codex exec`）从工作目录向上原生读取本文件。改动约定先改这里。

## 项目概述
3–10 岁儿童游戏化学习平台。Next.js 16 App Router + TypeScript + Tailwind 4 + Prisma + NextAuth v5 + Anthropic Claude SDK。

## 开发环境
- 操作系统: WSL2 Ubuntu（项目位于 `~/workspace/education/`）
- Node.js: v24 (nvm 管理)
- 包管理器: **npm**（本地开发未用 pnpm/Docker）
- 数据库: **SQLite**（开发用，文件 `prisma/dev.db`），生产可切回 PostgreSQL
- AI 精灵: 缺 `ANTHROPIC_API_KEY` 时 mock 回复，填入后自动切真实 Claude API

## 启动顺序
```bash
npm run db:push     # 首次或 schema 改动后
npm run dev         # Next.js dev server → http://localhost:3000
```

## 端口
- 3000  Next.js dev server
- 5555  Prisma Studio (`npm run db:studio`)

## 命令
- `npm run dev` / `npm run build` / `npm run start`
- `npm run db:push`   推送 schema 到 SQLite
- `npm run db:studio` Prisma Studio 可视化
- `npm run db:seed`   预填初始数据（如有）

## 开发规则
- 所有组件用 TypeScript strict，不用 `any`
- 样式用 Tailwind CSS（globals.css 里有自定义关键帧动画）
- 数据库操作通过 Prisma，不直接写 SQL
- Claude API 调用只在服务端（API Routes / Server Actions），密钥不暴露
- 组件文件超过 250 行时拆分
- 路由组：`(auth)` 登录注册无 HUD；`(game)` 游戏区有 HUD + 精灵

## 路由总览
```
/                         → 跳转到 /login 或 /child-select
/login, /register         认证
/child-select             孩子档案选择
/world                    世界大地图（5 关卡）
/play/[module]            游戏页（writing/alphabet/words/math/story）
/dashboard                家长后台（v1 简版）
/api/auth/...             NextAuth + 注册
/api/children             获取/创建孩子
/api/sessions             提交游戏结果
/api/fairy/chat           精灵对话（当前 mock）
```

## 环境变量
- `DATABASE_URL`         SQLite 文件路径
- `AUTH_SECRET`          NextAuth 签名
- `NEXTAUTH_URL`         http://localhost:3000
- `ANTHROPIC_API_KEY`    可选；缺失则 mock

## 音效系统
`components/audio/useSFX.ts`：纯 Web Audio API 合成，无外部音频文件。
```ts
const { sfx } = useSFX()
sfx.correct() // 答对    sfx.wrong() // 答错    sfx.coin() // 拿到星星
sfx.fanfare() // 通关    sfx.click() // 点击
```
（共 11 个具名音效，完整清单见 skill `mlk-audio-speech-recipes`。）

## 有声阅读
`lib/speech.ts`：Web Speech API 封装。中文 `zh-CN`，英文 `en-US`，优先 Tingting/Xiaoxiao 音色。逐字高亮通过定时器节奏化模拟（rate 自适应）。

## 标准验证
所有改动后跑类型检查；改 API 路由再跑鉴权冒烟。

```bash
# 类型检查（必跑）—— 无输出 = 通过
wsl -e bash -ic "cd ~/workspace/education && npx tsc --noEmit"

# 鉴权冒烟（改 API 路由后）：未登录应返 401，把 <path> 换成本路由
wsl -e bash -ic "curl -sI -X POST http://localhost:3000/api/<path> -o /dev/null -w '%{http_code}\n'"
```

> 已在 WSL Bash 内时可省去 `wsl -e bash -ic` 包装，直接 `cd ~/workspace/education && npx tsc --noEmit`。

## 脚本（scripts/）
可复用脚本（dev 运维、数据校验等）放 `scripts/`、随仓库提交，`bash scripts/<name>.sh` 运行；一次性/临时操作写 `/tmp` 跑完即弃。清单与约定见 `scripts/README.md`。
