# 魔法学习王国 (Magic Learning Kingdom)

## 项目概述
3–10 岁儿童游戏化学习平台。Next.js 16 App Router + TypeScript + Tailwind 4 + Prisma + NextAuth v5 + Anthropic Claude SDK。

## 开发环境
- 操作系统: WSL2 Ubuntu（项目位于 `~/workspace/education/`）
- Node.js: v24 (nvm 管理)
- 包管理器: **npm**（本地实现版本，未用 pnpm/Docker）
- 数据库: **SQLite**（开发用，文件 `prisma/dev.db`），生产可切回 PostgreSQL
- AI 精灵: 当前 mock 回复，填 `ANTHROPIC_API_KEY` 后自动切真实 Claude API

## 启动顺序
```bash
npm run db:push     # 首次或 schema 改动后
npm run dev         # Next.js dev server
# 浏览器访问 http://localhost:3000
```

## 端口
- 3000  Next.js dev server
- 5555  Prisma Studio (`npm run db:studio`)

## 命令
- `npm run dev`           开发服务器
- `npm run build`         生产构建
- `npm run start`         生产模式启动
- `npm run db:push`       推送 schema 到 SQLite
- `npm run db:studio`     Prisma Studio 可视化
- `npm run db:seed`       预填初始数据（如有）

## 开发规则
- 所有组件用 TypeScript strict，不用 `any`
- 样式用 Tailwind CSS（globals.css 里有自定义关键帧动画）
- 数据库操作通过 Prisma，不直接写 SQL
- Claude API 调用只在服务端（API Routes / Server Actions），密钥不暴露
- 组件文件超过 250 行时拆分
- 路由组：`(auth)` 登录注册无 HUD；`(game)` 游戏区有 HUD + 精灵

## 音效系统
`components/audio/useSFX.ts`：纯 Web Audio API 合成，无外部音频文件
```ts
const { sfx } = useSFX()
sfx.correct() // 答对
sfx.wrong()   // 答错
sfx.coin()    // 拿到星星
sfx.fanfare() // 通关
sfx.click()   // 点击
```

## 有声阅读
`lib/speech.ts`：Web Speech API 封装。中文 `zh-CN`，英文 `en-US`，优先 Tingting/Xiaoxiao 音色。逐词高亮通过定时器节奏化模拟（rate 自适应）。

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

## 实现进度（本会话已完成）
- [x] Next.js 16 App Router 项目骨架
- [x] Prisma SQLite Schema（User/Child/Progress/Session/Subscription...）
- [x] NextAuth v5 Credentials 登录/注册
- [x] 中间件路由保护（/world、/play、/dashboard、/child-select 需登录）
- [x] 多孩子档案选择
- [x] 世界大地图（5 关卡节点 SVG 路径）
- [x] 5 个游戏模块（写字 Canvas 描红 / 字母 / 单词配对 / 算术 / 故事 + TTS）
- [x] AI 精灵 SVG + 漂浮动画
- [x] Web Audio 音效（11 种）+ Web Speech TTS
- [x] Zustand 全局游戏状态
- [x] GameSession 持久化 + LearningProgress 更新
- [x] 精灵对话 API（mock 回复，预留 Claude 切换）
- [ ] 家长后台图表（Phase 4，本次未实现）
- [ ] 支付/订阅（Phase 5，本次未实现）
- [ ] 部署/Docker（Phase 5，本次未实现）

## 脚本（scripts/）

可复用脚本（docker 运维、数据校验等）放 `scripts/`、随仓库提交；一次性/临时操作（如提交时的 `index.lock` 守卫、探针）写 `/tmp` 跑完即弃。WSL 内运行：`bash scripts/<name>.sh`。清单与约定见 `scripts/README.md`。

## 自带 Skills（项目本地）

`.claude/skills/mlk-*` 下有 7 个项目本地 skill，按 frontmatter description 自动加载，无需手动 `/skill-name` 调用：

- **mlk-add-game-module** — 新游戏模块脚手架（含 Game.tsx.tmpl + content.ts.tmpl）
- **mlk-add-knowledge-pack** — 加内容 / 加知识问答 / 考试模式
- **mlk-adapt-classic-story** — 改编经典名著为儿童章节（西游记等）的篇幅/人物/社会现实 rubric
- **mlk-add-api-route** — 新 API 路由（auth + 校验 + Prisma 模板）
- **mlk-component-conventions** — UI 组件 / 动画 / 颜色约定
- **mlk-audio-speech-recipes** — useSFX + Web Speech cookbook
- **mlk-local-dev** — dev server + Windows 浏览器体验

设计与实施细节见 wiki：
- `[[projects/mlk/specs/2026-05-27-batch-E-skills-design]]`
- `[[projects/mlk/plans/2026-05-27-batch-E-skills-plan]]`

## Wiki Knowledge Base

Path: `E:\workspace\knowledge-wiki\` （git repo: `knowledge-wiki`）

### 写作规则（2026-05-02 起）

**写新方案 / 架构图 / 数据流程图 / 设计文档时，直接写入 wiki**，不再先写本地 `docs/` 再同步。

- 项目专属 → `wiki/projects/mlk/<topic>.md`（本项目 MLK 专用目录）
- 通用 Next.js / React / Prisma / 设计模式 → `wiki/domains/<domain>/<concept>.md`
- 双向 wikilink 关联两侧（`[[projects/mlk/xxx]]`、`[[domains/yyy/zzz]]`）
- 本地 `docs/` 仅保留 1-3 行 pointer stub（标题 + wikilink + 绝对路径）
- 例外：`Todo.md`、`CLAUDE.md`、`.claude/`、运行时配置仍在本地

### 阅读规则

需要项目以外的通用知识（Next.js / React / Tailwind / Prisma / Web Audio / 设计模式）时，按顺序读取：

1. `wiki/hot.md`（最近上下文，~500 字）
2. `wiki/index.md`（主目录，若 hot.md 不够）
3. `wiki/domains/<domain>/_index.md`（领域分类）
4. 具体页面（最后再读）

需要项目内架构 / 流程信息时，直接读 `wiki/projects/mlk/`。本地 `docs/*.md` 是指针，看到指针后跳到 wiki 读正文。

**不要**为以下情况查 wiki：
- 通用编程语法 / 语言问题
- 已经在本项目文件或对话上下文里的内容
- 与 Next.js / React / 儿童学习产品无关的任务

### MLK 项目入口

- 项目首页：`E:\workspace\knowledge-wiki\wiki\projects\mlk\mlk.md`
- 已写 specs：`wiki/projects/mlk/specs/`
- 已写 plans：`wiki/projects/mlk/plans/`
