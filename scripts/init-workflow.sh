#!/usr/bin/env bash
# init-workflow.sh — 一键把「Claude Code + Codex 双工具协作工作流」铺到任意仓库。
# 用途：拷贝本文件到目标仓库后运行，生成 .workflow/ 工作项结构、PROJECT.md 与路由片段。
# 幂等：已存在文件不覆盖（--force 才覆盖）；路由块用标记防重复注入。
# 用法：bash init-workflow.sh [目标目录]          # 默认当前目录
#       bash init-workflow.sh --force [目标目录]   # 覆盖已有文件
set -euo pipefail

usage() { sed -n '2,7p' "$0"; }

FORCE=0
TARGET="."
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "未知参数:$arg" >&2; usage; exit 2 ;;
    *) TARGET="$arg" ;;
  esac
done

# 注意：本脚本作用于「目标仓库」(默认 CWD)，刻意不像项目内运维脚本那样 cd 回固定根——
# 它就是要在别的工程里跑。
cd "$TARGET"
ROOT="$(pwd)"
echo "▶ 目标仓库:$ROOT  (force=$FORCE)"

created=()
skipped=()
ROUTING_MARKER="<!-- workflow-routing -->"

# write_file <path>  —— 内容从 stdin 读；不存在才写，--force 覆盖。
write_file() {
  local path="$1"
  if [[ -e "$path" && "$FORCE" -ne 1 ]]; then
    skipped+=("$path"); cat >/dev/null; return 0
  fi
  mkdir -p "$(dirname "$path")"
  cat > "$path"
  created+=("$path")
}

emit_routing() {
  cat <<'RT'
<!-- workflow-routing -->
# Task Routing

## Route By Task Type

- 探索 / 架构 / 根因不明的调试 / 系统与模块设计 → Claude Code。
- 规格明确的执行 / 批量改代码 / 补测试 / 一次性脚本 → Codex CLI。
- 代码审查 → 交给没写这段代码的工具。
- 拿不准 → 先询问,不要直接改代码。

## Mandatory Workflow Reads

- 接手任务前,先读 `.workflow/active.md`。
- 只打开 `current` 指向的工作项目录。
- 执行任务读 `PLAN.md` + `EXEC-LOG.md`;需要背景时再读 `DESIGN.md` / `source_ref`。
- 查历史只读 `.workflow/INDEX.md`,不要把所有 `items/*` 一次性塞进上下文。

# State
- 所有阶段状态以 `.workflow/` 下的 Markdown 为准,会话内存不是权威来源。
- `active.md` 记录当前工作项。
- `INDEX.md` 记录所有工作项摘要状态。
- 单个需求的状态只写在 `.workflow/items/<work-id>/` 目录内。

# Execution Gate
- 执行前确认:active.md 指向唯一工作项;PLAN.md 每步有文件、动作、验证、状态;DESIGN.md/source_ref 有验收标准。
- 方案变化时:先更新 source_ref/DESIGN.md,再把 PLAN.md 受影响步骤标为 stale,并在 EXEC-LOG.md 追加 [change]。
- 收尾条件:PLAN.md 必要步骤 done;EXEC-LOG.md 有最终验证;REVIEW.md 无未关闭 BLOCKING;INDEX.md 状态已更新。

# Prohibited
- 不要把多个需求追加到根目录单个 PLAN/LOG 文件。
- 不要在没有 PLAN.md 的情况下让 Codex 执行大范围改动。
- 不要在发现方案变化后继续按旧步骤执行。
- 不要审查自己刚写的代码,除非处于单干模式并显式标注风险。
RT
}

# ensure_context_file <path> <import_line>
#  - 不存在 → 新建:import + 路由块
#  - 存在无标记 → 追加路由块
#  - 已有标记 → 跳过
ensure_context_file() {
  local path="$1" import_line="$2"
  if [[ ! -e "$path" ]]; then
    { echo "$import_line"; echo; emit_routing; } > "$path"
    created+=("$path"); return 0
  fi
  if grep -qF "$ROUTING_MARKER" "$path" 2>/dev/null; then
    skipped+=("$path (已有路由块)"); return 0
  fi
  { echo; emit_routing; } >> "$path"
  created+=("$path (追加路由块)")
}

# ---- .workflow/ 索引 + 示例工作项 ----

WORK_ID="$(date +%F)-example"
WORK_DIR="$ROOT/.workflow/items/$WORK_ID"

write_file "$ROOT/.workflow/INDEX.md" <<TPL
---
status: index
last_updated: $(date +%F)
---

# Workflow Index

| work_id | status | title | current_step | links |
|---------|--------|-------|--------------|-------|
| $WORK_ID | planned | <功能名> | step1 | [plan](items/$WORK_ID/PLAN.md) |

使用规则:
- 这里只放摘要、状态、链接,不要写长设计或长日志。
- 当前任务指针见 \`.workflow/active.md\`。
- 历史任务按 \`items/<work-id>/\` 独立存放。
TPL

write_file "$ROOT/.workflow/active.md" <<TPL
---
status: planned
current: .workflow/items/$WORK_ID
last_updated: $(date +%F)
---

# Active Work Item

Current: \`.workflow/items/$WORK_ID\`

接手顺序:
1. 读当前工作项的 \`PLAN.md\`。
2. 读当前工作项的 \`EXEC-LOG.md\` 最后一段。
3. 需要背景时再读 \`DESIGN.md\` 或 \`source_ref\`。
TPL

write_file "$WORK_DIR/DESIGN.md" <<'TPL'
---
status: design        # design | planned | executing | review | done
source_ref: docs/superpowers/specs/<spec>.md 或 wiki/projects/<project>/specs/<spec>.md
last_updated: <date>
---

## 方案设计:<功能名>

### 背景 / 问题
<要解决什么,现状痛点>

### 方案
<架构 / 数据流 / 关键取舍>

### 验收标准
- [ ] <可验证的标准>

### 变更记录
- <date> [change] <如果需求期间改方案,在这里摘要说明,并同步更新 PLAN.md / EXEC-LOG.md>

> 你确认后 → 进入阶段2,产出 PLAN.md
TPL

write_file "$WORK_DIR/PLAN.md" <<'TPL'
---
status: planned        # design | planned | executing | review | done
design_ref: DESIGN.md
source_ref: docs/superpowers/plans/<plan>.md 或 wiki/projects/<project>/plans/<plan>.md
required_skills: []
last_updated: <date>
---

## 实现计划:<功能名>

### 步骤 1 — <动作>
- **改动文件**:src/<module>/<file>, src/<module>/<dir>/*
- **做什么**:<精确指令,不夹带推理>
- **验证**:运行 <测试命令>,应当 <预期结果>
- **状态**:todo        # todo | done | stale

### 步骤 2 — ...

### 方案变更处理
- 方案变化时,把受影响步骤标为 `stale`,新增替代步骤,并在 `EXEC-LOG.md` 追加 `[change]` 记录。
TPL

write_file "$WORK_DIR/REVIEW.md" <<'TPL'
---
status: review
target: PLAN.md 步骤 1-3
reviewer: claude-code   # 或 codex
---

## 审查意见

- [BLOCKING] <file>:<line> — <必须改:bug / 风险 / 漏处理>
- [SHOULD]   <file>:<line> — <建议改>
- [NIT]      <说明> — <可选>

> 阶段6 退出条件 = 没有未关闭的 BLOCKING。
TPL

write_file "$WORK_DIR/EXEC-LOG.md" <<'TPL'
---
status: executing
last_updated: <date>
---

## 执行记录

- <date> [step1] 完成,测试绿
- <date> [change] 方案调整:<原因>;影响:<stepX stale>;已更新:DESIGN.md / PLAN.md / source_ref
- <date> [review-r1] BLOCKING(<file>:<line>)→ 已修:<怎么改的>
- <date> [review-r1] SHOULD(...)→ 不修:<理由>,留 TODO
TPL

# ---- skills/ 共享 skill 目录说明 ----

write_file "$ROOT/skills/README.md" <<'TPL'
# skills/

项目级 agent skills 放这里。每个 skill 一个目录:

```text
skills/
└── <skill-name>/
    └── SKILL.md
```

## 什么时候写 skill

- 同类任务会重复出现。
- 有项目专属坑点或固定操作顺序。
- 需要让 Claude Code / Codex 在多个工作项里复用同一套规则。

一次性需求、长篇设计、架构背景不要写成 skill;放到 wiki/spec 或 `.workflow/items/<work-id>/`。

## SKILL.md 最小格式

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

## 在工作项里引用

在 `.workflow/items/<work-id>/PLAN.md` frontmatter 写:

```yaml
required_skills:
  - <skill-name>
```

如果某个工具不能自动加载项目 skills,规划者必须把相关 skill 的关键规则摘到 `PLAN.md` 对应步骤或 handoff prompt 里。
TPL

# ---- PROJECT.md 共享上下文 ----

write_file "$ROOT/PROJECT.md" <<'TPL'
# PROJECT — <项目名>

> 共享上下文唯一真相源。AGENTS.md / CLAUDE.md 均 @import 本文件。

## 技术栈
<语言 / 框架 / 数据库>

## 命令
- 构建:`<...>`
- 测试:`<...>`
- 运行:`<...>`

## 约定
- <编码 / 目录 / 提交 / 命名约定>

## 标准验证
所有改动后跑:`<测试命令>`,应当 <预期结果>。

## 设计文档落点
- 默认本地模式:Superpowers spec / plan 正文放 `docs/superpowers/specs/`、`docs/superpowers/plans/`。
- wiki 模式:spec / plan 正文放外部 wiki;本地 `docs/superpowers/` 只保留 1-3 行 stub 链接;`.workflow/items/<work-id>/` 只保留交接状态和可执行摘要。

## Skills
- 项目级 skills 目录:`skills/<skill-name>/SKILL.md`。
- 工作项需要 skill 时,在 `.workflow/items/<work-id>/PLAN.md` 的 `required_skills` 声明。
- 如果当前工具不能自动加载项目 skills,把相关 skill 的关键规则摘到 `PLAN.md` 或 handoff prompt。
- 新增/删除 skill 后,同步更新 `skills/README.md` 或本节清单。

## 工作流状态
- 当前工作项:`.workflow/active.md`
- 工作项索引:`.workflow/INDEX.md`
- 单个需求目录:`.workflow/items/YYYY-MM-DD-<slug>/`
TPL

# ---- AGENTS.md / CLAUDE.md:import + 路由块 ----

ensure_context_file "$ROOT/AGENTS.md" "@PROJECT.md"
ensure_context_file "$ROOT/CLAUDE.md" "@PROJECT.md"

# ---- 汇总 ----

echo
echo "✓ 新建/更新:"
for f in "${created[@]:-}"; do [[ -n "$f" ]] && echo "    + ${f#$ROOT/}"; done
if [[ "${#skipped[@]}" -gt 0 ]]; then
  echo "↷ 已存在,跳过(--force 可覆盖):"
  for f in "${skipped[@]:-}"; do [[ -n "$f" ]] && echo "    · ${f#$ROOT/}"; done
fi

cat <<'NEXT'

下一步:
  1. 填 PROJECT.md(技术栈 / 命令 / 标准验证)——两个工具都靠它。
  2. 把生成的示例工作项目录改名为真实 work-id,并同步更新 .workflow/active.md / INDEX.md。
  3. 阶段1 在当前工作项写 DESIGN.md,确认后进阶段2 PLAN.md。
  4. 需要可复用经验时,在 skills/<name>/SKILL.md 新增 skill,并在 PLAN.md 的 required_skills 声明。
  5. (默认) 轻量同步: 保持 AGENTS.md / CLAUDE.md 引用 PROJECT.md,先不引入配置同步器。
  6. (可选) 完整同步:  npx @nicepkg/vsync --help  # 确认后再 vsync init && vsync sync --dry-run
  7. (可选) 官方桥接:  Claude Code 内  /plugin marketplace add openai/codex-plugin-cc
  完整说明见 WORKFLOW.md。
NEXT
