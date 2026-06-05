---
status: done
source_ref: WORKFLOW.md
last_updated: 2026-06-05
---

## 方案设计:MLK 轻量接入新版工作流

### 背景 / 问题
`WORKFLOW.md` 已经定义通用双工具工作流,但 MLK 现有 `CLAUDE.md` 明确保留小改 fast path:常规改动直接改,只有架构/跨系统/不可逆变更才写 spec。迁移必须避免把所有任务都流程化。

### 方案摘要
`.workflow/items/` 只用于 substantial multi-step work:架构、跨模块、schema、安全权限、不可逆或多步骤特性。`AGENTS.md` 继续作为项目事实单一真源;协作策略放在 `CLAUDE.md`。现有 `.claude/skills/mlk-*` 保留,新增 `skills/README.md` 作为跨工具说明。

### 验收标准
- [done] `CLAUDE.md` 明确 `.workflow` 只用于复杂/多步骤工作。
- [done] `CLAUDE.md` 明确保留小改直接改 fast path。
- [done] `AGENTS.md` 含轻量「协作工作流」指针(供 Codex 冷启动),但**无**重流程门禁块。
- [done] `skills/README.md` 说明现有 `.claude/skills/mlk-*` 和 Codex 兜底方式。
