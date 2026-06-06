# skills/

项目级、Claude 与 Codex 共用的 Skills 放这里。当前 MLK 的领域 Skills 仍位于：

```text
.claude/skills/mlk-*/SKILL.md
```

## 当前规则

- 现有 `.claude/skills/mlk-*` 暂时保留，先验证新工作流再迁移。
- 新增跨工具 Skill 优先放 `skills/<skill-name>/SKILL.md`。
- Codex handoff 只提供需要读取的 Skill 路径，不复制 Skill 正文。
- 每个任务默认只加载一个主 Skill，明确跨领域时再追加。
- 详细触发索引见 `docs/agent/domains/INDEX.md`。

## 新增 SKILL.md 最小格式

```markdown
---
name: <skill-name>
description: Use when <触发条件>
---

# <Skill Name>

## 适用场景
- <什么时候用>

## 必做步骤
1. <步骤>

## 验证
- <命令或检查项>

## 常见坑
- <项目专属注意点>
```
