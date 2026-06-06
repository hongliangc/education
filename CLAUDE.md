# 魔法学习王国

@AGENTS.md

## 执行策略

- 默认由一个 Agent 完成任务。
- Claude 已深入读取代码后，局部修改直接完成，不再转交 Codex 重复理解。
- 规格明确、文件范围明确的实现或测试，可直接委派 Codex。
- 只有架构、跨模块、schema、安全、大范围行为变化才先写正式方案。
- worktree 按风险和并行需要使用，不与文档流程绑定。

## Codex Handoff

无正式方案的小任务使用不超过 20 行的 prompt，只写目标、文件、验收、约束和验证。

有正式方案时，Claude 与 Codex 读取同一份外部 wiki，只传绝对路径和本次执行范围：

```text
读取 /mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/plans/<topic>.md，
执行其中任务 N-M；
设计见 /mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/specs/<topic>.md；
只修改计划列出的文件；完成后运行指定验证。
```

- 不复制 `AGENTS.md`、Skill 或 wiki 正文到 handoff。
- Codex 完成后，Claude 先看 `git diff --stat`、本次 diff 和验证结果。
- 只有发现具体风险时才补读关联代码或 wiki。
- 普通任务最多一轮整改；高风险任务最多两轮。

## 外部 Wiki

知识库不在当前仓库：

- Windows：`E:\workspace\knowledge-wiki\`
- WSL：`/mnt/e/workspace/knowledge-wiki/`
- 项目设计/计划：`wiki/projects/mlk/specs/`、`wiki/projects/mlk/plans/`
- 通用知识：`wiki/domains/`

新方案、架构图、数据流程和实施计划直接写入 wiki。本地 `docs/superpowers/` 只在工具兼容需要时保留 1-3 行 pointer stub，不复制正文。

读取时先定位具体项目或领域页面，不要批量加载整个 wiki。当前仓库或对话已有答案时不查 wiki。

## 项目 Skills

现有 `.claude/skills/mlk-*` 按触发条件加载。跨工具规则逐步迁移到 `skills/`；当前任务只加载命中的主 Skill，明确跨领域时再追加。
