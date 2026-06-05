# 魔法学习王国 (Magic Learning Kingdom)

> 项目事实（技术栈 / 命令 / 开发规则 / 路由 / 标准验证 / 脚本约定）见 **AGENTS.md**，Claude 与 Codex 共享单一真源。本文件只放 Claude Code 专属内容。

@AGENTS.md

## 协作分工

| 阶段 | 用谁 | 目的 |
|---|---|---|
| 读项目、理解架构、拆方案 | Claude Code | 看全局、找调用链 |
| 写具体代码、改文件、跑测试 | Codex | 执行明确任务 |
| 修编译/测试错误 | Codex | 快速迭代 |
| Review diff | Claude Code | 查 bug、查风险、查遗漏 |
| 整理提交 commit/PR | 用户 / Codex | 收尾 |

一句话：**Claude 先当架构师，Codex 当程序员，Claude 最后当 Reviewer。**

> **Codex 是可选助手**：当前可用，但不保证长期使用，刻意保持**松耦合**——`AGENTS.md` 是独立的项目事实文档（Claude 经 `@import` 读、本身就有价值，且该文件本就由 Next.js 生成），skills 是 Claude 的手册，scripts 是通用运维，都不依赖 Codex。停用 Codex 只需删掉下面的「委派 Codex」小节、把分工表里 Codex 的行换回 Claude，其余一切不变。

### 何时直接改 vs 何时先写 spec

**只有涉及架构的才写方案**——别对常规改动反射式触发 brainstorming/写 spec：

- **直接改**（Codex 写 + Claude review，不写 spec）：接口/调用调整、局部代码改动、bugfix、加题/加内容、UI 小改、配置/脚本、文案。
- **先 brainstorm → spec（wiki）→ 实现**：架构 / 跨子系统 / 数据模型（schema）变更 / 新子系统或新模块范式 / 安全·权限 / 不可逆或大范围影响。
- 拿不准 = 一句话问用户，别默认走重流程。
- **启用 `.workflow/items/`**:仅用于架构 / 跨模块 / schema / 安全权限 / 不可逆 / 多步骤且需要跨会话交接的需求。常规小改继续走上面的“直接改”路径。
- `.workflow` 是状态层,不是强制所有任务的流程门禁;没有进入 `.workflow` 的小改不需要创建 DESIGN/PLAN/EXEC-LOG/REVIEW。
- 完整双工具流程与门禁见 `WORKFLOW.md`(仅复杂 item 适用,小改不走)。

### 委派 Codex

Codex 原生读 `AGENTS.md`，所以 `codex exec` 的 prompt 只需带「任务 + 从相关 skill 摘出的少量规则 + 跑标准验证」：

```bash
wsl -e bash -ic "cd ~/workspace/education && codex exec '<任务描述 + 规则>'"
```

- Codex 自己跑 `AGENTS.md` 标准验证并修编译/测试错误。
- 回来后 Claude review diff（`codegraph_impact` 查影响面、查 bug/遗漏），通过再 commit。
- **不**委派：与任何 Codex 批次无关的孤立单行小改、纯探索/读代码——Claude 直接做更快。
- **批次内聚**：一旦进入 Codex 委派 / CR 循环，同一批次内的小改、资源落位、说明补充也归 Codex；Claude 不从批次里摘小块自己改，除非用户明确要求或 Codex 不可用。
- 上网研究、选源、版权判断、下载策略默认归 Claude；Codex 只在来源和规则明确后执行落地。
- 若任务已进入 `.workflow/` 复杂 item：`codex exec` 的 prompt 前附接手口令（先读 `.workflow/active.md` → 打开 `current` 目录的 `PLAN.md` / `EXEC-LOG.md` → 按步骤执行并回写状态，见 `WORKFLOW.md` §5.5）；常规小改仍走上面的一行 `codex exec`。
- **提交收敛**：单个需求（尤其进入 `.workflow/` 的工作项）收尾时把多次本地提交 squash 成一次（提交信息带 work-id），分支合并主干保持「一需求一 commit」。详见 `WORKFLOW.md` §5.6。

## 自带 Skills（项目本地）

`.claude/skills/mlk-*` 下 7 个本地 skill 按 frontmatter 自动加载，无需手动调用。它们是 Claude 的「架构 / Review 手册」，也是委派 Codex 时摘录规则的来源。
设计见 `[[projects/mlk/specs/2026-05-27-batch-E-skills-design]]` 与 `[[projects/mlk/specs/2026-06-02-workflow-codex-config-cleanup-design]]`。

## Wiki Knowledge Base

Path: `E:\workspace\knowledge-wiki\` （git repo: `knowledge-wiki`）

### 写作规则（2026-05-02 起）

**写新方案 / 架构图 / 数据流程图 / 设计文档时，直接写入 wiki**，不再先写本地 `docs/` 再同步。

- 项目专属 → `wiki/projects/mlk/<topic>.md`（本项目 MLK 专用目录）
- 通用 Next.js / React / Prisma / 设计模式 → `wiki/domains/<domain>/<concept>.md`
- 双向 wikilink 关联两侧（`[[projects/mlk/xxx]]`、`[[domains/yyy/zzz]]`）
- 本地 `docs/` 仅保留 1-3 行 pointer stub（标题 + wikilink + 绝对路径）
- 例外：`Todo.md`、`CLAUDE.md`、`AGENTS.md`、`.claude/`、运行时配置仍在本地

### 阅读规则

需要项目以外的通用知识（Next.js / React / Tailwind / Prisma / Web Audio / 设计模式）时，按顺序读取：

1. `wiki/hot.md`（最近上下文，~500 字）
2. `wiki/index.md`（主目录，若 hot.md 不够）
3. `wiki/domains/<domain>/_index.md`（领域分类）
4. 具体页面（最后再读）

需要项目内架构 / 流程信息时，直接读 `wiki/projects/mlk/`。本地 `docs/*.md` 是指针，看到指针后跳到 wiki 读正文。

**不要**为以下情况查 wiki：
- 通用编程语法 / 语言问题
- 已经在本项目文件或对话上下文里的内容
- 与 Next.js / React / 儿童学习产品无关的任务

### MLK 项目入口

- 项目首页：`E:\workspace\knowledge-wiki\wiki\projects\mlk\mlk.md`
- 已写 specs：`wiki/projects/mlk/specs/`
- 已写 plans：`wiki/projects/mlk/plans/`
