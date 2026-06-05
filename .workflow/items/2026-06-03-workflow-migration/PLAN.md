---
status: done
design_ref: WORKFLOW.md
source_ref: WORKFLOW.md
required_skills: []
last_updated: 2026-06-05
---

# Lightweight Workflow Adoption Plan

> **For agentic workers:** This plan has been executed, reviewed, verified, and committed. Preserve MLK's existing fast path: small/local changes do not require `.workflow` ceremony.

**Goal:** Adopt `.workflow/items/` in MLK only for substantial multi-step work while keeping the existing `CLAUDE.md` "直接改, no spec" path for small changes.

**Architecture:** `AGENTS.md` remains the project fact source. `CLAUDE.md` remains the collaboration/routing layer for Claude Code and keeps `@AGENTS.md`. `.workflow/` is an optional state layer for architecture, cross-module, schema, security, irreversible, or multi-step features. Existing `.claude/skills/mlk-*` stay in place; `skills/README.md` documents how to bridge project skills for Codex.

**Tech Stack:** Markdown workflow files, existing `AGENTS.md` / `CLAUDE.md`, shell validation via `bash -n`.

---

## Files

- Create: `.workflow/items/2026-06-03-workflow-migration/DESIGN.md`
- Modify: `.workflow/items/2026-06-03-workflow-migration/PLAN.md`
- Create: `.workflow/items/2026-06-03-workflow-migration/EXEC-LOG.md`
- Create: `.workflow/items/2026-06-03-workflow-migration/REVIEW.md`
- Create: `skills/README.md`
- Modify: `CLAUDE.md`
- Modify: `AGENTS.md` (add a ≤5-line `## 协作工作流` pointer only; **no** heavy Task Routing / Execution Gate block)
- Modify: `WORKFLOW.md` (§3 routing block reconciled to one identical form with init)
- Create: `scripts/check-routing-sync.sh`
- Verify: `scripts/init-workflow.sh`
- Modify: `scripts/README.md` (document check-routing-sync.sh)

## Non-Goals

- Do not inject the full `Task Routing / Execution Gate / Mandatory Workflow Reads / Prohibited` block into `AGENTS.md`. A ≤5-line `## 协作工作流` pointer (without those heading strings) IS allowed, so Codex—which reads AGENTS.md natively, not CLAUDE.md—sees the protocol on cold start.
- Do not require `.workflow` for small bugfixes, copy changes, local UI tweaks, content additions, or one-file config/script edits.
- Do not migrate existing `.claude/skills/mlk-*` into `skills/`.
- Do not introduce `PROJECT.md` into MLK in this migration.

## Task 1: Complete The Current Work Item State Files

- [done] **Step 1: Create `DESIGN.md` for this work item**

Write `.workflow/items/2026-06-03-workflow-migration/DESIGN.md`:

```markdown
---
status: planned
source_ref: WORKFLOW.md
last_updated: 2026-06-03
---

## 方案设计:MLK 轻量接入新版工作流

### 背景 / 问题
`WORKFLOW.md` 已经定义通用双工具工作流,但 MLK 现有 `CLAUDE.md` 明确保留小改 fast path:常规改动直接改,只有架构/跨系统/不可逆变更才写 spec。迁移必须避免把所有任务都流程化。

### 方案摘要
`.workflow/items/` 只用于 substantial multi-step work:架构、跨模块、schema、安全权限、不可逆或多步骤特性。`AGENTS.md` 继续作为项目事实单一真源;协作策略放在 `CLAUDE.md`。现有 `.claude/skills/mlk-*` 保留,新增 `skills/README.md` 作为跨工具说明。

### 验收标准
- [done] `CLAUDE.md` 明确 `.workflow` 只用于复杂/多步骤工作。
- [done] `CLAUDE.md` 明确保留小改直接改 fast path。
- [done] `AGENTS.md` 含 ≤5 行「协作工作流」指针(供 Codex 冷启动),但**无**重流程门禁块。
- [done] `skills/README.md` 说明现有 `.claude/skills/mlk-*` 和 Codex 兜底方式。
```

- [done] **Step 2: Create `EXEC-LOG.md`**

Write `.workflow/items/2026-06-03-workflow-migration/EXEC-LOG.md`:

```markdown
---
status: planned
last_updated: 2026-06-03
---

## 执行记录

- 2026-06-03 [plan] 已将迁移计划改为轻量接入方案,等待用户确认后执行。
```

- [done] **Step 3: Create `REVIEW.md`**

Write `.workflow/items/2026-06-03-workflow-migration/REVIEW.md`:

```markdown
---
status: review
target: PLAN.md
reviewer: pending
last_updated: 2026-06-03
---

## 审查意见

- 暂无。执行完成后由未写代码的工具或人工按 BLOCKING / SHOULD / NIT 审查。
```

## Task 2: Reconcile MLK Routing In `CLAUDE.md`

- [done] **Step 1: Extend "何时直接改 vs 何时先写 spec"**

Modify `CLAUDE.md` under the existing section `### 何时直接改 vs 何时先写 spec` by adding:

```markdown
- **启用 `.workflow/items/`**:仅用于架构 / 跨模块 / schema / 安全权限 / 不可逆 / 多步骤且需要跨会话交接的需求。常规小改继续走上面的“直接改”路径。
- `.workflow` 是状态层,不是强制所有任务的流程门禁;没有进入 `.workflow` 的小改不需要创建 DESIGN/PLAN/EXEC-LOG/REVIEW。
- 完整双工具流程与门禁见 `WORKFLOW.md`(仅复杂 item 适用,小改不走)。
```

- [done] **Step 2: Add a Codex handoff line under "委派 Codex"**

Modify `CLAUDE.md` under the existing section `### 委派 Codex` by adding:

```markdown
- 若任务已进入 `.workflow/` 复杂 item:`codex exec` 的 prompt 前附接手口令(先读 `.workflow/active.md` → 打开 `current` 目录的 `PLAN.md`/`EXEC-LOG.md` → 按步骤执行并回写状态,见 WORKFLOW.md §5.5);常规小改仍走上面的一行 `codex exec`。
```

- [done] **Step 3: Add a ≤5-line workflow pointer to `AGENTS.md`**

Append to `AGENTS.md` (Codex reads it natively, so this is how Codex sees the protocol on cold start). Do **not** add the heavy routing block:

```markdown
## 协作工作流（复杂任务才用）
- 常规小改:直接改(见 CLAUDE.md 的「何时直接改 vs 何时先写 spec」)。
- 架构 / 跨模块 / schema / 安全 / 不可逆 / 多步跨会话的需求:走 `.workflow/`。
- 任一工具接手前先读 `.workflow/active.md`,只打开 `current` 指向的工作项目录,执行读其 `PLAN.md`/`EXEC-LOG.md`。
- 完整流程与门禁见 `WORKFLOW.md`。
```

- [done] **Step 4: Verify `AGENTS.md` carries no heavy routing block**

Run:

```bash
if grep -nE "Task Routing|Execution Gate|Mandatory Workflow Reads|Prohibited" AGENTS.md; then
  echo "unexpected heavy workflow routing in AGENTS.md"
  exit 1
fi
```

Expected: no output, exit code 0 (the ≤5-line pointer uses none of those heading strings).

- [done] **Step 5: Add the one-commit-per-work-item convention**

Append to `CLAUDE.md` at the end of the `### 委派 Codex` section:

```markdown
- **提交收敛**:单个需求(尤其进入 `.workflow/` 的工作项)收尾时把多次本地提交 squash 成一次(提交信息带 work-id),分支合并主干保持「一需求一 commit」。详见 `WORKFLOW.md` §5.6。
```

## Task 3: Add Project Skill Bridge Documentation

- [done] **Step 1: Create `skills/README.md`**

Write:

````markdown
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
````

- [done] **Step 2: Verify existing local skills are discoverable**

Run:

```bash
find .claude/skills -maxdepth 2 -name SKILL.md | sort
```

Expected: lists existing `mlk-*` skill files.

## Task 4: Verify Template Files Remain Consistent

- [done] **Step 1: Run shell syntax validation**

Run:

```bash
bash -n scripts/init-workflow.sh
```

Expected: no output, exit code 0.

- [done] **Step 2: Run init workflow smoke test**

Run:

```bash
tmpdir=/tmp/mlk-workflow-check
rm -rf "$tmpdir"
mkdir -p "$tmpdir"
bash scripts/init-workflow.sh "$tmpdir"
test -f "$tmpdir/skills/README.md"
test -f "$tmpdir/.workflow/active.md"
test -f "$tmpdir/.workflow/INDEX.md"
current="$(sed -n 's/^current: //p' "$tmpdir/.workflow/active.md" | head -1)"
test -f "$tmpdir/${current#./}/PLAN.md" || test -f "$tmpdir/$current/PLAN.md"
```

Expected: exit code 0.

- [done] **Step 3: Scan for obsolete workflow paths**

Run:

```bash
if grep -nE '\.workflow/(DESIGN|PLAN|EXEC-LOG|REVIEW)\.md|\.workflow/PLAN\.md|\.workflow/EXEC-LOG\.md|ai-config-sync-manager|§7\.5' WORKFLOW.md scripts/init-workflow.sh scripts/README.md AGENTS.md CLAUDE.md; then
  echo "unexpected obsolete workflow reference"
  exit 1
fi
```

Expected: no output, exit code 0.

- [done] **Step 4: Add the routing anti-drift gate**

Create `scripts/check-routing-sync.sh` with exactly this content, then `chmod +x` it:

````bash
#!/usr/bin/env bash
# Fail if the routing block in WORKFLOW.md §3 and scripts/init-workflow.sh
# emit_routing() drift apart (whitespace-insensitive).
set -euo pipefail
cd "$(dirname "$0")/.."

wf="$(awk '
  /^## 3\./             {in3=1}
  in3 && /^```markdown/ {grab=1; next}
  grab && /^```/        {grab=0; in3=0}
  grab                  {print}
' WORKFLOW.md)"

init="$(awk '/cat <<.RT./{g=1;next} g&&/^RT$/{g=0} g{print}' \
  scripts/init-workflow.sh | grep -v '<!-- workflow-routing -->')"

norm() { sed 's/[[:space:]]*$//' | grep -v '^[[:space:]]*$'; }

if ! diff <(printf '%s\n' "$wf" | norm) <(printf '%s\n' "$init" | norm) >/dev/null; then
  echo "ROUTING DRIFT: WORKFLOW.md §3 vs init-workflow.sh emit_routing"
  diff <(printf '%s\n' "$wf" | norm) <(printf '%s\n' "$init" | norm) || true
  exit 1
fi
echo "routing block in sync"
````

Add a one-line entry for it to `scripts/README.md`.

- [done] **Step 5: Reconcile §3 to one identical block and make the gate pass**

`WORKFLOW.md` §3 stays the human-editable source (per its blockquote). The text to standardize on is init's current `emit_routing()` body — it carries the proper inline-code backticks and the full `# State` section. Replace the body inside §3's `# Task Routing` markdown fence (from `# Task Routing` down to just before the closing fence) with init's `emit_routing()` body, **excluding** the leading `<!-- workflow-routing -->` marker line. Leave `scripts/init-workflow.sh` unchanged.

Run until green:

```bash
bash scripts/check-routing-sync.sh
```

Expected: prints `routing block in sync`, exit code 0.

## Task 5: Final Documentation Validation And Status Update

- [done] **Step 1: Validate documentation-only change**

Run:

```bash
bash -n scripts/init-workflow.sh
```

Expected: no output, exit code 0.

- [done] **Step 2: Append final execution evidence**

Append to `.workflow/items/2026-06-03-workflow-migration/EXEC-LOG.md`:

```markdown
- 2026-06-03 [verify] bash -n scripts/init-workflow.sh -> pass
- 2026-06-03 [verify] /tmp init-workflow smoke -> pass
- 2026-06-03 [verify] AGENTS.md heavy routing scan -> pass
```

- [done] **Step 3: Move status to review**

Update:
- `.workflow/INDEX.md`: status for `2026-06-03-workflow-migration` to `review`.
- `.workflow/active.md`: `status: review`.
- `.workflow/items/2026-06-03-workflow-migration/PLAN.md`: `status: review`.

Expected: work item is ready for human or cross-tool review.
