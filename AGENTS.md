<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Before changing Next.js code, read the relevant guide in `node_modules/next/dist/docs/` and follow its deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md - 魔法学习王国

3-10 岁儿童游戏化学习平台。技术栈：Next.js 16 App Router、TypeScript、Tailwind 4、Prisma、NextAuth v5。

## 硬规则

- TypeScript strict，不使用 `any`。
- 样式使用 Tailwind CSS；复用已有组件和 `globals.css` 动画。
- 数据库操作通过 Prisma，不直接写 SQL。
- AI/API 密钥只在服务端使用。
- 组件超过 250 行时按职责拆分。
- 路由组：`(auth)` 无 HUD；`(game)` 有 HUD 和精灵。
- 不覆盖、回滚或提交其他需求的未提交改动。

## 任务路由

- 默认单 Agent 完成；不要为形式化分工启动第二个 Agent。
- 目标和文件明确的实现、补测试、批量修改可直接交给 Codex。
- 根因不明、需要研究或架构判断时，由当前 Agent 先完成定位与决策。
- 只有跨模块、schema、安全、大型功能、多 Agent 并行或主工作区冲突时才使用 worktree。
- 需求默认只写 spec（外部 wiki）并据此直接开发；plan / writing-plans 默认不写。开发中若 Agent 判断确有必要写 plan（步骤多、依赖乱、需分阶段检查点），主动向用户提出、经确认后再写——不擅自写，也不闷头跳过这层判断。小改连 spec 都不建，也不创建状态文档。
- Claude/Codex handoff 只传 wiki 路径与执行范围，或使用不超过 20 行的短 prompt。
- 普通协作任务最多一轮整改；高风险任务最多两轮，仍有 BLOCKING 时交用户裁决。

## 按需读取

- Next.js 代码：按文件类型读取 `node_modules/next/dist/docs/` 的相关指南。
- 领域规则：按任务触发 `.claude/skills/mlk-*/SKILL.md`，不要批量加载。
- 项目 spec（及按需才有的 plan）：读取外部 wiki 的具体页面，不扫描整个知识库。
- Bugfix 流程：`bugfix/README.md`
- 脚本清单：`scripts/README.md`
- 当前仓库或对话已有答案时，不额外查 wiki。

## 开发命令

```bash
npm run db:push
npm run dev
npm run build
npm run db:studio
```

开发数据库为 SQLite：`prisma/dev.db`。缺少 `ANTHROPIC_API_KEY` 时使用 mock 回复。

## 标准验证

所有代码改动必须运行：

```bash
npx tsc --noEmit
```

修改 API 路由时，额外验证未登录请求返回 401：

```bash
curl -sI -X POST http://localhost:3000/api/<path> -o /dev/null -w '%{http_code}\n'
```

修改 Agent 入口、Skills 或协作规则时，额外运行：

```bash
bash scripts/check-agent-context.sh
```

## Bugfix

用户报告缺陷、异常、回归或要求修复时，先按 `bugfix/README.md` 创建记录，再诊断和修改。同一 bug 最终只形成一个 commit，且不得混入其他需求。
