# check-agent-context.sh 的旧工作流引用检查静默失效

- id: `2026-06-06-check-agent-context-rg-silent-skip`
- status: verified
- commit: this commit

## 现象与复现
- 运行 `bash scripts/check-agent-context.sh` 输出 `line 45: rg: command not found`，但仍打印 `agent context checks passed` 且 `exit 0`。
- `rg` 并非脚本可依赖的项目基础命令：部分 Agent PATH 中存在，Claude 的干净 Bash 子 shell 中可能不存在。

## 根因
- 脚本用 `rg ... || true` 扫描旧工作流引用。`rg` 不存在时命令报错被 `|| true` 吞掉，`obsolete_refs` 恒为空，检查永远不触发，脚本却照常 passed。
- 这正是方案 §9 想用脚本守住的「仓库不残留旧工作流引用」验收项，实际成了死代码。

## 修复
- 将 `rg -n` 换成可移植的 `grep -nE`。模式与文件列表不变。

## 回归测试
- 在 `skills/README.md` 注入 `WORKFLOW.md` 字样后脚本 FAIL 并列出该行（exit 1）；移除后恢复 passed。已验证。

## 验证
- `bash scripts/check-agent-context.sh` → `agent context checks passed`，exit 0，无 `command not found`。已验证。
- 清洁环境 `env -i HOME="$HOME" PATH=/usr/bin:/bin bash scripts/check-agent-context.sh` → passed。
- 临时副本注入旧工作流引用 → FAIL，exit 1。
