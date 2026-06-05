---
status: done
last_updated: 2026-06-05
---

# Workflow Migration Issues

## Scope

本文件记录本轮基于 `WORKFLOW.md` 复查发现的问题、优先级和处理结果。P0/P1/P2-1 已处理;其余 P2/P3 为非阻塞遗留,延期到后续确认或独立工作项。

## P0 阻塞交接

### P0-1 `CLAUDE.md` 漏写复杂任务 Codex handoff 规则
- **问题**:`PLAN.md` 要求在「委派 Codex」下写明复杂 `.workflow` item 的接手口令,但 `CLAUDE.md` 实际缺失。
- **影响**:Codex 可能按普通任务执行,不读 / 不回写 `.workflow` 状态,影响跨 agent 接手。
- **处理结果**:已处理。
- **改动**:`CLAUDE.md` 已补充复杂 `.workflow` item 委派 Codex 时先读 `.workflow/active.md`、当前 `PLAN.md` / `EXEC-LOG.md`,并按步骤回写状态。

### P0-2 `CLAUDE.md` 漏写“一需求一 commit”提交收敛规则
- **问题**:`PLAN.md` 要求写入 squash / work-id / 一需求一 commit 规则,但 `CLAUDE.md` 实际缺失。
- **影响**:容易把 workflow 迁移、视频库 stub、资源下载等混进同一次提交,增加耦合。
- **处理结果**:已处理。
- **改动**:`CLAUDE.md` 已补充 `.workflow` 工作项收尾时 squash 成一次提交,提交信息带 work-id。

## P1 状态真源不一致

### P1-1 `.workflow` 阶段状态冲突
- **问题**:`active.md` / `INDEX.md` / `PLAN.md` 为 `review`,但 `DESIGN.md` / `EXEC-LOG.md` 仍为 `planned`。
- **影响**:落盘状态不一致,新 agent 接手时无法明确当前阶段。
- **处理结果**:已处理。
- **改动**:`DESIGN.md` 和 `EXEC-LOG.md` frontmatter 已同步为 `status: review`。

### P1-2 `DESIGN.md` 验收项未勾选
- **问题**:`REVIEW.md` 写“验收标准全部满足”,但 `DESIGN.md` 仍保留未勾选验收项。
- **影响**:设计验收与审查结论矛盾。
- **处理结果**:已处理。
- **改动**:`DESIGN.md` 验收项已改为 `[done]`。

### P1-3 `PLAN.md` 顶部提示过期
- **问题**:`PLAN.md` 顶部仍写“等待用户 review,不要执行”,但计划已经执行并进入 review。
- **影响**:后续 agent 可能误判计划尚未执行。
- **处理结果**:已处理。
- **改动**:`PLAN.md` 顶部提示已改为“已执行,等待最终 review / commit”。

## P2 文档策略和长期可维护性

### P2-1 MLK 轻量指针模式与 `WORKFLOW.md` 通用模板表述不完全一致
- **问题**:`WORKFLOW.md` 通用模板描述完整路由块写入 `AGENTS.md` / `CLAUDE.md`,但 MLK 实际采用 `AGENTS.md` 轻量指针 + `WORKFLOW.md` 完整正文。
- **影响**:后续审查可能误判 MLK 没按模板落地。
- **处理结果**:已处理。
- **改动**:`WORKFLOW.md` 新增 §3.3「两种落地模式:完整注入 vs 轻量指针」,明确两种都算按模板落地,并给轻量模式两条合规判据;审查不再误判。

### P2-2 `active.md` 单指针不适合并行 worktree
- **问题**:`active.md` 只有一个 `current`,适合串行,不适合多个 agent / worktree 并行。
- **影响**:并行开发时全局 current 可能互相覆盖。
- **处理结果**:已延期(非阻塞)。
- **建议**:补规则:串行读 `active.md`;并行 handoff 必须显式给 `.workflow/items/<work-id>`。

### P2-3 `EXEC-LOG.md` 有重复验证记录
- **问题**:日志中保留了 2026-06-03 的旧验证记录,与后续 final verify 重复。
- **影响**:增加阅读 token,但不影响判断。
- **处理结果**:已延期(非阻塞)。
- **建议**:收尾前可压缩为一条 final verify 摘要。

## P3 提交边界 / 后续需求归档

### P3-1 工作树混有非 workflow 迁移内容
- **问题**:当前工作树还有 `issue.md`、视频相关 spec stub、`资源下载/` 等未跟踪项。
- **影响**:直接 `git add -A` 会破坏“一需求一 commit”。
- **处理结果**:已延期(不属于本次迁移提交)。
- **建议**:workflow 迁移单独提交;其他内容单独建 work item 或单独提交。

### P3-2 `issue.md` 的真实需求未转成工作项
- **问题**:`issue.md` 包含阿里云盘视频库、星星兑换视频解锁、AI/DeepSeek 应答截断问题。
- **影响**:复杂需求未进入 `.workflow/INDEX.md`,后续 agent 接手时看不到正式计划。
- **处理结果**:已延期(后续独立工作项)。
- **建议**:拆成独立 `.workflow/items/<work-id>/`。

## Verification

- 2026-06-04 `bash scripts/check-routing-sync.sh` -> pass (`routing block in sync`)
- 2026-06-04 AGENTS heavy routing scan -> pass (no output, exit 0)
- 2026-06-04 `bash -n scripts/init-workflow.sh` -> pass (no output, exit 0)
- 2026-06-04 `npx tsc --noEmit` -> pass (no output, exit 0)
- 2026-06-05 P2-1 §3.3 落地后 `bash scripts/check-routing-sync.sh` -> pass (`routing block in sync`;§3.3 在路由围栏外,门禁不受影响)
