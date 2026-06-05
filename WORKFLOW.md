# 多 Agent 协作工作流:Claude Code + Codex CLI(通用模板)

> 通用于任意工程项目(后端 / 前端 / 全栈 / 游戏)。语言/框架相关示例集中在**附录 A**,正文保持中立。
>
> 🚀 **快速复制到新项目**:把 `scripts/init-workflow.sh` 拷到目标仓库根目录,`bash init-workflow.sh` 即可一键铺好 `.workflow/` 工作项结构、`PROJECT.md`、`skills/README.md` 与路由片段(幂等,不覆盖已有文件)。

---

## 0. 设计目标(这套工作流为什么存在)

四个目标决定了下面每一处机制。读不懂某段设计时,回到它服务的目标即可。

| # | 目标 | 怎么达成 | 落点(去哪看) |
|---|------|----------|----------------|
| 1 | **减少 token 消耗** | 状态落盘后按需读取:接手只读 `active.md` + 当前工作项的 `PLAN.md`/`EXEC-LOG.md`,不把历史 `items/*` 全塞进上下文;长正文留在 wiki,工作项只存摘要;可重复经验固化成 skill,少读代码 | §1 状态层、§7.3 Skills |
| 2 | **支持不同 agent 协同开发** | 明确角色分工 + 七阶段门禁 + 交叉审(写代码的工具不审自己)+ 路由规则按任务类型分派 | §2 角色与七阶段、§3 路由 |
| 3 | **随意切换使用** | 所有阶段状态都是仓库里的 Markdown,任一工具读 `active.md` 即可接手;双调用通道(文件 handoff 为底座,Codex 插件直接调用为增强);一个工具配额耗尽/不可用,另一个续上 | §4 调用通道、§5 运行模式 |
| 4 | **减少耦合** | 共享配置只是**只读输入**,每个工具各读各用,谁都不需要对方在线;单一真源 + import/symlink,不做运行时耦合;工具特定项(hooks/权限)各自维护;维护工具只**翻译格式**不绑定运行时 | §7 共享配置 + 维护工具层 |

**心智模型**

| 工具 | 角色 | 强项 | 弱点 |
|------|------|------|------|
| Claude Code | 探索者 / 架构师 / Reviewer | 开放式设计、根因调试、系统性改动、交叉审查 | 长会话易跑偏、可能匹配症状即宣布完成 |
| Codex CLI | 执行者 | 规格明确的批量执行、并行、CI、严格守约束 | 开放式设计偏弱,不主动探索 |

一句话:**目标不明确 → Claude Code;目标明确 → Codex。**

---

## 1. 核心机制:状态落盘(`.workflow/`)——支撑「随意切换」+「减少 token」

`.workflow/` 是**交接状态层**,不是知识库本体。它的唯一职责:让任一工具随时读出"当前在哪个阶段、计划是什么、审了什么、修了什么",从而能接手。会话内存不是权威来源,**以落盘文件为准**。

```
project/
├── PROJECT.md          # 共享上下文:架构、约定、命令、标准验证(两个工具都读)
├── AGENTS.md           # Codex 原生读取 → 引用 PROJECT.md + 路由规则
├── CLAUDE.md           # Claude Code 读取 → 引用 AGENTS.md/PROJECT.md + 路由规则
├── skills/             # 跨工具共享的 SKILL.md(开放标准,write-once)
├── docs/superpowers/   # 可选:Superpowers spec/plan 的本地 stub 或正文
└── .workflow/
    ├── INDEX.md        # 工作项索引:只放摘要、状态、链接
    ├── active.md       # 当前工作项指针(current: 指向唯一目录)
    └── items/
        └── YYYY-MM-DD-<slug>/
            ├── DESIGN.md       # 阶段1:方案摘要 / source_ref
            ├── PLAN.md         # 阶段2:Codex 可执行计划
            ├── EXEC-LOG.md     # 阶段3/5:执行 + 修复回应
            └── REVIEW.md       # 阶段4/6:审查意见(带级别)
```

### 1.1 读取顺序(省 token 的关键)

1. 先读 `.workflow/active.md`,拿到当前工作项路径。
2. 再读该工作项的 `PLAN.md` + `EXEC-LOG.md`。
3. **只有**需要方案背景时才读 `DESIGN.md` 或 `source_ref` 指向的 wiki/spec。
4. 查历史先读 `.workflow/INDEX.md`,再按需打开具体工作项——**不要把 `items/*` 一次性塞进上下文**。

### 1.2 工作项拆分(别堆单文件)

不要把所有需求追加到根目录单个 `DESIGN/PLAN/EXEC-LOG`。每个需求一个 `items/<work-id>/` 目录,互不污染。新建 / 切换 / 收尾:

```bash
# 新建
WORK_ID="$(date +%F)-<slug>"
mkdir -p ".workflow/items/$WORK_ID"
# 从模板或上一个工作项 cp 四个文件,然后更新 active.md(current)、INDEX.md(加一行)

# 切换:只改 active.md 的 current 和 status,不移动历史目录、不合并日志
# 收尾:PLAN 全 done、EXEC-LOG 有最终验证、REVIEW 无未关闭 BLOCKING、INDEX 改 done;提交 squash 成一次(一需求一 commit)
```

### 1.3 设计正文落点:本地模式 vs wiki 模式(减少 token)

| 模式 | 正文落点 | 仓库里留什么 | `.workflow/` 怎么用 |
|------|----------|--------------|---------------------|
| **本地模式(默认)** | `docs/superpowers/specs/`、`plans/` | 完整 spec / plan | 工作项 `DESIGN/PLAN` 可放正文或摘要 |
| **wiki 模式** | 外部 wiki(如 `wiki/projects/<project>/`) | `docs/superpowers/...` 只留 1-3 行 stub 链接 | 工作项只放 wiki 链接 + 当前状态 + 可执行摘要 |

wiki 模式规则:长正文(设计、架构图、推理)进 wiki;`.workflow/items/<id>/PLAN.md` **必须保留 Codex 可直接执行的步骤摘要**,保证不读 wiki 也能执行。这样每个工具只加载它当下需要的最小正文。

### 1.4 需求期间改方案:人工显式联动

方案变更**不自动联动**。改了什么 → 必须同步什么:

| 改了什么 | 同步更新 |
|----------|----------|
| 设计/架构取舍 | 源头 spec(wiki 或本地)+ 工作项 `DESIGN.md` 摘要 |
| 执行步骤/文件范围/验证 | 工作项 `PLAN.md`:受影响步骤标 `stale`,新增替代步骤 |
| 当前阶段/是否返工 | `INDEX.md` + `active.md` 的 status |
| 已执行步骤受影响 | `EXEC-LOG.md` 追加 `[change]`:原因、影响、下一步 |
| 旧 review 失效 | `REVIEW.md` 标 stale 或新开一轮 |

---

## 2. 角色与七阶段 —— 支撑「多 agent 协同」

| 阶段 | 主力(默认) | 落盘产物 | 退出条件 |
|------|------------|----------|----------|
| 1 方案设计 | Claude Code | spec + 工作项 `DESIGN.md` | 方案确认,验收标准明确 |
| 2 执行计划 | Claude Code | plan + 工作项 `PLAN.md` | 步骤可被 Codex 直接执行 |
| 3 工作执行 | Codex | 代码 + `EXEC-LOG.md` | 必要步骤 done,验证通过 |
| 4 代码 CR | Claude Code(交叉审) | `REVIEW.md` | 意见写完并分级 |
| 5 反馈修改 | Codex | 代码 + 追加 `EXEC-LOG.md` | BLOCKING 全部回应 |
| 6 再次 CR | 4 ↔ 5 循环 | `REVIEW.md` 迭代 | 无未关闭 BLOCKING |
| 7 中途改方案 | Claude Code | 更新 source/`DESIGN`/`PLAN`/`EXEC-LOG` | 受影响步骤标 stale,回阶段 1-2 |

**交叉审原则**:写代码的工具不审自己的代码。Codex 执行 → Claude 审;Claude 执行 → Codex 审。换一个模型当 reviewer = 一双不同来源的新眼睛。

### 2.1 阶段门禁(不满足不准进下一阶段)

| 阶段 | 必改文件 | 禁止进入下一阶段的情况 |
|------|----------|------------------------|
| 1 设计 | spec;工作项 `DESIGN.md` | 没有验收标准;`source_ref` 为空;方案未确认 |
| 2 计划 | `PLAN.md`;`active.md`;`INDEX.md` | 步骤缺文件范围/验证命令;夹带大段推理;状态不是 `todo` |
| 3 执行 | 代码;`PLAN.md` 状态;`EXEC-LOG.md` | 未运行验证;失败未记录;方案已不适用却继续 |
| 4 CR | `REVIEW.md` | 未分级;没有文件/行号;只写泛泛建议 |
| 5 反馈 | 代码;`EXEC-LOG.md` | BLOCKING 未回应;修复后无验证 |
| 6 再 CR | `REVIEW.md` 新一轮 | 仍有未关闭 BLOCKING |
| 7 改方案 | source;`DESIGN`;`PLAN`;`EXEC-LOG` | 只改 wiki 不改计划;只改代码不标 stale |

### 2.2 状态流转

```text
design -> planned -> executing -> review -> executing -> review -> done
                         \                         /
                          -> stale ---------------
```

状态写入:`active.md`(整体)、`INDEX.md`(所有工作项摘要)、`PLAN.md`(每步 `todo`/`done`/`stale`)、`EXEC-LOG.md`(执行/验证/变更事实)。

---

## 3. 路由规则(写进 `AGENTS.md` / `CLAUDE.md`)

> 这是唯一正本。`scripts/init-workflow.sh` 会把同一块注入新项目的 `AGENTS.md`/`CLAUDE.md`;改路由先改这里再同步脚本。

```markdown
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
```

### 3.1 路由实施细则

路由不靠 agent 自觉,靠文件门禁约束:

| 场景 | 先做什么 | 交给谁 | 必须落盘 |
|------|----------|--------|----------|
| 新需求/大改动 | 建工作项,写 `DESIGN.md` + source spec | Claude 规划 | `active.md`、`INDEX.md`、`DESIGN.md` |
| 已有明确计划 | 检查 `PLAN.md` 门禁 | Codex 执行 | `PLAN.md` 状态、`EXEC-LOG.md` |
| 执行/测试失败 | 记录失败和命令输出摘要 | Codex 修,或 Claude 根因 | `EXEC-LOG.md` |
| 需求变更 | 更新 source spec + 工作项摘要 | Claude 重新规划 | `DESIGN.md`、`PLAN.md` stale、`EXEC-LOG.md [change]` |
| 执行完成 | 准备 review | 未写代码的工具 | `REVIEW.md` |
| BLOCKING 修复 | 逐条回应 | 执行工具 | `EXEC-LOG.md` |

### 3.2 可复制接手口令

给任一工具开新会话时直接附上:

```text
先执行工作流门禁:
1. 读取 .workflow/active.md。
2. 打开 current 指向目录的 PLAN.md 和 EXEC-LOG.md。
3. 检查 DESIGN.md/source_ref 是否有验收标准。
4. 若 PLAN.md 缺文件范围、动作、验证命令或步骤状态,先停止并补计划。
5. 执行中只更新当前工作项目录和相关代码,不要读取全部历史 items/*。
```

### 3.3 两种落地模式:完整注入 vs 轻量指针

路由规则进项目有两种方式,按项目现状选,**两种都算「按模板落地」**:

| 模式 | 怎么落地 | 适合 |
|------|----------|------|
| **完整注入(默认)** | `init-workflow.sh` 把上面整块路由写进 `AGENTS.md` / `CLAUDE.md` | 新项目,或没有既有协作约定的项目 |
| **轻量指针** | 项目自有协作文档只放 ≤5 行指针(何时用 `.workflow`、接手先读 `active.md`、详见 `WORKFLOW.md`);完整规则留在 `WORKFLOW.md` 正文,不重复注入 | 已有成熟 `CLAUDE.md` / `AGENTS.md` 约定、想避免重复与冲突的项目(如 MLK) |

轻量指针模式合规**至少**满足以下两条(此外:`AGENTS.md` 指针需自包含、handoff prompt 可用等配套也要到位):

- ① **接手口令可达**:`active.md` + 当前 item 的 `PLAN.md` / `EXEC-LOG.md` 能被指引读到(Codex 侧靠 `AGENTS.md` 指针或 handoff prompt,见 §5.5)。
- ② **完整流程有据**:规则在 `WORKFLOW.md` 正文可查。

审查时**不要因为没在 `AGENTS.md` 看到完整路由块,就判定「没按模板落地」**。

---

## 4. 调用通道 —— 支撑「随意切换」(两条并存)

两条通道同时存在,默认走通道一,需要会话内即时审查/委派时叠加通道二。

### 通道一:文件落盘 handoff(默认底座,最稳)

任一工具读 `.workflow/active.md` → 打开当前工作项目录 → 看 `PLAN.md` 步骤状态和 `EXEC-LOG.md` 最后一行 → 接着干。绕开所有版本/会话 bug,一个工具配额耗尽,另一个直接续上。这是协作的**默认底座**。

```bash
# Claude 规划完,Codex 执行:
codex "读取 .workflow/active.md,按当前工作项 PLAN.md 执行,逐步更新每步 status,完成后写 EXEC-LOG.md"

# 非交互跑批(注:--full-auto 自 v0.128 起弃用,改用 --sandbox 或命名 profile):
codex exec --sandbox workspace-write "按 PLAN.md 执行并补测试"

# fast 模式:规格明确的执行/批量改可降低推理强度,更快更省(复杂/易错任务保持默认 medium/high):
codex exec --sandbox workspace-write -c model_reasoning_effort="low" "按 PLAN.md 执行"
#   也可在 ~/.codex/<name>.config.toml 配 profile,再 --profile <name> 复用(键名以 Codex 版本为准)。
```

### 通道二:Codex 插件直接调用(已安装 `codex@openai-codex`)

官方桥接插件 `codex-plugin-cc` 已安装,可在 **Claude Code 会话内直接调用 Codex**,无需离开会话:

```text
/codex:review               # 标准审查当前 diff
/codex:adversarial-review   # 对抗式挑刺
/codex:rescue               # 整段任务委派给 Codex
```

鉴权复用本地 `~/.codex/config.toml`。适合:Claude 写完想立刻让 Codex 交叉审、或把一段明确任务即时甩给 Codex。

> 边界:双向"实时"仍是半成品(Claude → Codex 多为轮询/请求,非对称 push)。把插件当"会话内增强",**文件落盘仍是默认 handoff**——这正是「随意切换」不依赖任何一个工具在线的保证。

### 通道选择

| 想要 | 用哪条 |
|------|--------|
| 跨会话 / 跨工具接管、配额切换、并行 worktree | 通道一(文件) |
| 会话内即时 CR、即时把小任务甩给 Codex | 通道二(插件) |
| 大需求全流程 | 通道一为主,通道二在 CR 阶段叠加 |

---

## 5. 运行模式与关键点确认

### 5.1 模式选择

| 模式 | 设计 | 计划 | 执行 | CR | 何时用 |
|------|------|------|------|----|--------|
| **双工具(默认)** | Claude | Claude | Codex | Claude 交叉审 | 需求有明确步骤,两个工具都可用 |
| **Codex 受限 → Claude 单干** | Claude | Claude | Claude | Claude `/review` 或人工 | Codex 不可用/权限不足/需大量探索 |
| **Claude 受限 → Codex 单干** | Codex `/plan` | Codex | Codex | Codex `/review` 或人工 | Claude 不可用,但需求边界已清楚 |

默认双工具。只有配额、权限、工具不可用、或任务明显不适合另一工具时才切单干。

### 5.2 开始前 5 项确认(不满足不进执行)

| 检查项 | 落点 | 通过标准 |
|--------|------|----------|
| 当前任务是谁 | `active.md` | `current` 指向唯一工作项 |
| 需求源在哪 | `DESIGN.md` 的 `source_ref` | 指向 wiki/本地 spec |
| 计划是否可执行 | `PLAN.md` | 每步有文件、动作、验证命令、状态 |
| 验收标准 | `DESIGN.md`/`PLAN.md` | 能判断 done / not done |
| 验证命令可运行 | `PROJECT.md` + `PLAN.md` | 写明测试/类型检查/构建/冒烟命令 |

### 5.3 双工具 SOP

1. **Claude 设计+计划**:写/更新 spec → 更新 `DESIGN.md` 摘要 → 写 `PLAN.md` → 更新 `active.md`/`INDEX.md`。
2. **Codex 执行**:读 `active.md` → 开 `PLAN.md`/`EXEC-LOG.md` → 逐步执行,每步改 `done`,验证写进 `EXEC-LOG.md`;方案不适用则标 `stale`,不默默按旧计划继续。
3. **Claude 审查**:只审当前 diff,`REVIEW.md` 按 `BLOCKING`/`SHOULD`/`NIT` 写;有 BLOCKING 回到 Codex,无 BLOCKING 才收尾。
4. **Codex 反馈修改**:对每条 BLOCKING 在 `EXEC-LOG.md` 追加"怎么修 + 验证结果";不修必须写理由,BLOCKING 原则上不跳过。

### 5.4 单干模式

- **Claude 单干**:仍按 `.workflow/items/<id>/` 写状态文件,不只靠会话记忆;执行后显式跑 `/review` 或人工复核;最终回复带验证证据。
- **Codex 单干**:先 `/plan` 或人工补齐 `PLAN.md` 再执行;需求不清先补 `DESIGN.md` 约束;CR 至少一次。

### 5.5 Handoff Prompt 模板

```text
# 交给 Codex 执行
读取 .workflow/active.md,打开当前工作项 PLAN.md 和 EXEC-LOG.md。
按 PLAN.md 逐步执行,每完成一步更新状态为 done,运行验证命令并追加结果到 EXEC-LOG.md。
方案/步骤不适用时,把受影响步骤标 stale,在 EXEC-LOG.md 追加 [change],不要猜测执行。
完成后汇总改动文件、验证命令和剩余风险。

# 交给 Claude 审查
读取 .workflow/active.md,只审当前工作项相关 diff。
按 REVIEW.md 格式输出 BLOCKING / SHOULD / NIT,优先找 bug、行为回归、遗漏验证、方案偏离。
不要重写实现,除非我明确要求。
```

### 5.6 收尾出口

同时满足才算完成:`PLAN.md` 必要步骤全 `done` 且无遗留 `stale`;`EXEC-LOG.md` 有最终验证命令和结果;`REVIEW.md` 无未关闭 `BLOCKING`;`INDEX.md` 状态为 `done`;spec/stub 链接仍有效。

**提交收敛:一个工作项 = 一次提交。** 开发期间可以多次本地提交,收尾时 squash 成一个 commit(提交信息带 work-id)。这样工作项分支合并主干时历史干净——**一个需求对应一个可回溯节点**,回滚/审阅都以需求为单位。

---

## 6. 文件模板

```markdown
# active.md
---
status: executing
current: .workflow/items/2026-06-03-feature-a
last_updated: 2026-06-03
---

# DESIGN.md
---
status: design   # design | planned | executing | review | done
source_ref: wiki/projects/<project>/specs/<spec>.md  # 或 docs/superpowers/specs/<spec>.md
last_updated: 2026-06-03
---
## 方案设计:<功能名>
### 背景 / 问题
### 方案摘要        # 只放交接摘要;完整正文见 source_ref
### 验收标准
- [ ] <可验证的标准>

# PLAN.md(结构化,适合 Codex 执行)
---
status: planned
design_ref: DESIGN.md
required_skills: []   # 需要的 skill 名,声明在这里
last_updated: 2026-06-03
---
## 实现计划:<功能名>
### 步骤 1 — <动作>
- **改动文件**:src/<module>/<file>.ts
- **做什么**:<精确指令,不夹带推理>
- **验证**:运行 <命令>,应当 <预期结果>
- **状态**:todo   # todo | done | stale

# REVIEW.md(带级别,保证循环收敛)
---
status: review
target: PLAN.md 步骤 1-3
reviewer: claude-code   # 或 codex
---
## 审查意见
- [BLOCKING] src/auth/session.ts:42 — 空 token 会抛未捕获异常
- [SHOULD]   src/auth/login.ts:18 — 魔法数 0.3 提到常量
- [NIT]      命名 tmp 建议改 pendingSession

# EXEC-LOG.md
---
status: executing
last_updated: 2026-06-03
---
## 执行记录
- 2026-06-03 [step1] 完成,测试绿
- 2026-06-03 [change] 方案调整:<原因>;影响:step2 stale;已更新:DESIGN/PLAN
- 2026-06-03 [review-r1] BLOCKING(session.ts:42)→ 已修:加空 token 守卫
```

> 计划要"步骤 + 文件清单 + 验证命令",**避免散文式、夹带大段推理**——那种 Codex 执行效果差。级别定义:`BLOCKING`(必须改)/`SHOULD`(建议)/`NIT`(可选);**阶段 6 退出 = 无未关闭 BLOCKING**。

---

## 7. 共享配置 + 维护工具层 —— 支撑「减少耦合」

**核心原则:共享配置 ≠ 运行时耦合。** 共享的 `PROJECT.md`/`AGENTS.md`、skills、MCP 定义都是**只读输入**,每个工具各自读各自用,谁都不需要对方在线。这与"任一工具独立跑完整流程"不冲突。

四类东西可以共享,各有机制:

| 共享什么 | 机制 | 一处改全生效 |
|----------|------|--------------|
| **上下文(项目事实)** | `PROJECT.md`/`AGENTS.md` symlink 或 `@import` | 是 |
| **Skills(操作手册)** | 同一 `SKILL.md`,跨工具开放标准(CC 与 Codex 均一等公民) | 是 |
| **MCP servers** | 用同步工具一处定义,翻译成各家格式 | 是(用工具) |
| **文档方案(spec/plan)** | wiki 正文 + `.workflow/` 的 `source_ref` 指针 | 是(改 source) |

不要共享(各自维护反而更清晰):**Hooks**(事件模型根本不同)、**权限/沙箱**(CC 在应用层 hook,Codex 在 OS 内核层 Seatbelt/Landlock/seccomp)、**Subagents**(可翻译,但行为差异仍需各自验证)。

### 7.1 落地顺序(别一上来就上同步器)

1. `bash init-workflow.sh` 铺 `.workflow/` + `PROJECT.md` + 路由块。
2. 填 `PROJECT.md`(技术栈/命令/标准验证/Skills 规则),让两个工具先能**独立工作**。
3. 只用 `AGENTS.md`/`CLAUDE.md` + `.workflow/items/<id>/PLAN.md` 跑一个工作项。
4. 出现重复任务,再加 `skills/<name>/SKILL.md`。
5. 只有开始共享 MCP/Agents/Commands 时,再引入同步工具(§7.3)。

第 1 天只需要这套最小集:`PROJECT.md` + `AGENTS.md` + `CLAUDE.md` + `skills/README.md` + `.workflow/`。`.claude/settings.json`、`.codex/config.toml` 是进阶项,不要提前引入。

### 7.2 Skills 落地

Skill = 把**可重复的项目经验**固化成操作手册,让 agent 少读代码、少走弯路(直接服务目标 1)。它不是工作项状态,也不是长设计文档。

- **写 skill**:同类任务反复出现、有项目专属坑点/约定。**不写**:一次性需求(那是工作项)、长背景设计(那进 wiki)。
- **放哪**:优先 `skills/<name>/SKILL.md`(跨工具共享);已有 `.claude/skills/` 的项目**不强迁**,保留现状,在 `PROJECT.md` 写清 Codex 如何摘录其规则。
- **让两个工具都用上**:Claude Code 读项目 `skills/` 或软链 `.claude/skills -> ../skills`;Codex 按其 skills 路径配置或软链。**软链前先确认目标不存在,不要覆盖已有 `.claude/skills`**。
- **工作项声明**:`PLAN.md` frontmatter 写 `required_skills`;执行工具不能自动加载时,由规划者把关键规则摘进 `PLAN.md` 步骤或 handoff prompt。

`SKILL.md` 最小格式:`name` + `description: Use when <触发条件>` + 适用场景 / 必做步骤 / 验证 / 常见坑。

### 7.3 维护工具(三层方案,按需上)

先判断你要同步的是**说明文件**还是**工具配置**——别用重工具解决轻问题:

| 方案 | 解决什么 | 代价 |
|------|----------|------|
| **A 轻量:手工 symlink / `@import`**(默认) | 多个 agent 读同一份项目事实与路由 | 几乎无配置;不翻译 MCP/Skills/Agents |
| **B 中间层:`@agents-dev/cli`(候选)** | AGENTS.md-centric 的 Instructions/Skills/MCP 同步 | **用前必须核验包名、版本、命令和 dry-run 输出** |
| **C 完整:`@nicepkg/vsync`** | Skills/MCP/Agents/Commands 在多工具间格式转换 + drift 检测 | 多一个同步配置;同步前必须 dry-run |

**方案 A(默认推荐)**——只保证读同一份事实,最稳最易复制:

```bash
# 用法 1:AGENTS.md 单一真源,Claude 只包装它
printf '@AGENTS.md\n' > CLAUDE.md
# 用法 2:两个工具各有少量专属内容,共同引用 PROJECT.md
printf '@PROJECT.md\n' > AGENTS.md && printf '@PROJECT.md\n' > CLAUDE.md
```

> 可选脚注:`agentlink`(**martinmose/agentlink**)是 instruction-file symlink 工具,把一份说明软链到多个工具入口,不是 MCP 同步工具。注意有同名的 **digimetalab/agentlink**(MCP 配置同步,名字冲突)。它与 `ln -s AGENTS.md CLAUDE.md` 作用重叠,不作默认依赖;用前先确认装的是哪一个,并跑 `agentlink check` 核对软链状态。

**方案 B(中间层,候选)**——和本模板的 AGENTS.md 模型匹配,但命令/包名可能变化,先核验:

```bash
npm view @agents-dev/cli version
npx @agents-dev/cli --help   # 确认命令和目标文件后,再 init / status / dry-run / sync
```

**方案 C(完整同步)**——长期同时用 CC/Codex/Cursor/Gemini 时:

```bash
npm i -g @nicepkg/vsync     # 或 npx @nicepkg/vsync --help
vsync init                  # 选真相源和目标工具
vsync status && vsync sync --dry-run   # 先看计划写入
vsync sync                  # 确认 diff 后写入
```

- **可同步**:Skills、MCP servers、Agents/Commands(生成后仍要在目标工具验证行为)。
- **不同步**:Hooks、高风险权限(参考结果但手动确认)、**密钥值(只同步变量名/占位符,真实 token 绝不进仓库)**。
- **不要依赖未验证包名**:某个同步 CLI 在 npm/GitHub 找不到稳定来源,就不要写进默认路径。

> **松耦合保证**:停用任一工具或任一同步方案,只需删对应小节/软链,其余一切不变。`AGENTS.md` 本就是独立的项目事实文档,`.workflow/` 是纯 Markdown,skills 是开放标准——没有任何一环绑死某个工具在线。

### 7.4 验证清单

> 2 文件模型(无 `PROJECT.md`,如用 `AGENTS.md` 单源)时,跳过下面 `PROJECT.md` 相关检查。

```bash
# 共享上下文
test -f PROJECT.md && test -f AGENTS.md && test -f CLAUDE.md
grep -nE "Task Routing|Execution Gate|Skills" AGENTS.md CLAUDE.md PROJECT.md

# 工作项状态
test -f .workflow/active.md && test -f .workflow/INDEX.md
current="$(sed -n 's/^current: //p' .workflow/active.md | head -1)"
test -n "$current" && test -f "$current/PLAN.md" && test -f "$current/EXEC-LOG.md"

# skill 可见性
test -f skills/README.md
find skills -maxdepth 2 -name SKILL.md -print

# 同步工具没越界(引入 vsync 后)
vsync status && vsync sync --dry-run   # 只改预期文件、不写密钥、不删工具专属 hooks/权限
```

---

## 8. 启动命令速查

```bash
# 模式 A:Claude 规划,Codex 执行(最常用)
#   1) Claude 会话内写 .workflow/items/<id>/PLAN.md 并更新 active.md
#   2) codex "读取 .workflow/active.md,按当前 PLAN.md 执行,逐步更新 status,完成写 EXEC-LOG.md"

# 模式 B:并行 worktree(多个独立改动)
git worktree add ../feat-a main && cd ../feat-a && codex "读取 .workflow/items/<id-a>/PLAN.md 并执行"
git worktree add ../feat-b main && cd ../feat-b && codex "读取 .workflow/items/<id-b>/PLAN.md 并执行"

# 模式 C:Codex 非交互跑批,Claude 审
codex exec --sandbox workspace-write "升级依赖并修复 breaking 测试"

# 会话内直接调用(codex@openai-codex 已安装)
/codex:review            # 交叉审当前 diff
/codex:rescue            # 整段任务委派
```

---

## 9. 实操踩坑(2026)

- **桥接优先级**:文件落盘(`.workflow/`)是默认 handoff;`codex-plugin-cc`(已装)当会话内增强;社区 bridge(`claude-codex-bridge` 等)仅在需要其特定能力(如实时 web UI)时再用。
- **MCP server 控制在 5-7 个以内**:再多会拖垮工具选择准确率,不常用的该断就断。
- **`--full-auto` 已弃用**:`codex exec --full-auto` 自 v0.128 起为弃用兼容路径(当前 ~v0.135,会 warning);非交互跑批用 `--sandbox workspace-write` 或命名 profile(`--profile <name>`)。
- **Codex 实现类任务**:默认 Pragmatic 模式更易出错,切 Friendly 模式更稳。
- **添加 MCP**:CC 用 `claude mcp add <name> ...`;Codex 用 `codex mcp add` 或写 `config.toml`;交给同步工具后自动处理。

---

## 附录 A — 语言/框架专属提醒

> 正文保持中立;把项目特定的坑写这里。

- 把文件模板里的中立路径(`src/<module>/...`)换成你技术栈的真实路径;验证命令换成你的测试/构建/类型检查入口。
- 主流 benchmark 多是 Python/JS/TS;**冷门语言/框架(如 GDScript + 节点/信号)下两个工具都更不可靠**,人工 reviewer 权重要更高,尤其审 Codex 的 diff。
- `SKILL.md` 在 Codex 与 Claude Code **均为一等公民**,可跨工具共享;hooks / TOML subagents 是 Codex 原生,各自维护。
- 领域资产(RAG MCP、Obsidian、关卡设计 skill 等):CC 侧正常挂载;Codex 侧用 AGENTS.md + 自己的 skills/subagents,或交同步工具统一。
- 正文流程(七阶段 / 交叉审 / 三模式 / 文件落盘 / 四目标)与技术栈无关,**照搬不改**。
