# skills/

项目级跨工具 skills 放这里。当前 MLK 项目已有 Claude Code 专属 skills:

```text
.claude/skills/mlk-*/SKILL.md
```

## 当前规则

- 现有 `.claude/skills/mlk-*` 先保留,不强迁移。
- 委派 Codex 时,如果 Codex 不能自动读取这些 skill,规划者必须把关键规则摘到 `.workflow/items/<work-id>/PLAN.md` 或 Codex handoff prompt。
- 新增跨工具 skill 时,优先放 `skills/<skill-name>/SKILL.md`。
- 工作项需要 skill 时,在 `PLAN.md` frontmatter 的 `required_skills` 声明。

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
