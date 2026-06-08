# 魔法学习王国

@AGENTS.md

路由、Codex 委派条件、worktree、wiki 写入与按需读取规则都在 AGENTS.md，不在此重复。以下仅为 Claude 专属补充。

## Codex Handoff 模板

无正式方案的小任务用不超过 20 行的 prompt（目标、文件、验收、约束、验证）。

有正式方案时，Claude 与 Codex 读同一份外部 wiki，只传绝对路径和本次执行范围：

```text
读取 /mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/plans/<topic>.md，
执行其中任务 N-M；设计见同目录 specs/<topic>.md；
只修改计划列出的文件；完成后运行指定验证。
```

Codex 完成后，Claude 先看 `git diff --stat`、本次 diff 和验证结果，只有发现具体风险时才补读关联代码或 wiki。

## 外部 Wiki 路径

- WSL：`/mnt/e/workspace/knowledge-wiki/`（Windows：`E:\workspace\knowledge-wiki\`）
- 设计/计划：`wiki/projects/mlk/specs/`、`wiki/projects/mlk/plans/`；通用知识：`wiki/domains/`
- 本地 `docs/superpowers/` 仅在工具兼容需要时留 1-3 行 pointer stub，不复制正文。
