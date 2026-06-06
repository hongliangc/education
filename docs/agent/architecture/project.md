# Project Architecture

## Runtime

- WSL2 Ubuntu，Node.js 24，npm。
- Next.js 开发端口 3000；Prisma Studio 端口 5555。
- 开发数据库为 SQLite：`prisma/dev.db`。
- `DATABASE_URL`、`AUTH_SECRET`、`NEXTAUTH_URL` 为基础环境变量。
- `ANTHROPIC_API_KEY` 可选；缺少时 AI 精灵使用 mock 回复。

## Routes

```text
/                         -> /login 或 /child-select
/login, /register         -> 认证
/child-select             -> 孩子档案选择
/world                    -> 世界地图
/play/[module]            -> 学习游戏
/dashboard                -> 家长后台
/api/auth/...             -> NextAuth 与注册
/api/children             -> 孩子档案
/api/sessions             -> 游戏结果
/api/fairy/chat           -> 精灵对话
```

## Subsystems

- 音效：`components/audio/useSFX.ts`，Web Audio API 合成。
- 语音：`lib/speech.ts` 与 `lib/speech/`，Web Speech API 和云端 TTS。
- 内容：`content/`。
- 游戏组件：`components/games/`。
- 数据访问：`lib/db.ts`、`prisma/schema.prisma`。

具体领域约定从 `../domains/INDEX.md` 选择对应 Skill。
