---
name: mlk-add-knowledge-pack
description: Use when expanding MLK learning content — adding items to existing pools (汉字/字母/单词/算术/故事), a new knowledge-quiz module (生活常识/科普/安全), or a multi-module exam mode (加题 / 加内容 / 加知识点 / 考试). NOT for new game mechanics (→ mlk-add-game-module).
---

# 加内容 / 加知识点 / 考试模式

## 何时用
- 往现有 `content/*.ts` 加更多条目（汉字、字母、单词、算术、故事）
- 新建"知识问答"型模块（4 选 1 题库形态），如生活常识、科学、安全
- 做"考试模式"：跨多 module 抽题 + 计时 + 综合报告

## 三种场景分支

### 场景 1：往现有 module 加题/词/字

直接编辑 `content/<module>.ts`，遵循该文件已有 shape：

- `content/chars.ts` — `CharItem { char, pinyin, meaning, hint }`
- `content/alphabet.ts` — `LetterItem { letter, word, emoji }`
- `content/words.ts` — `WordPair { zh, en, emoji }`
- `content/math.ts` — `MathProblem { question, answer, visual? }`
- `content/stories.ts` — `Story { id, emoji, title, text, questions[], moral }`

**注意**：故事的 `questions` 每个故事固定 3 题递进，最后一题必须挂"道理总结"。

### 场景 2：新建知识问答模块

知识问答模块 = 一种游戏模块。**模块注册步骤（MODULES / MODULE_META / SLUGS / schema 注释 / world NODES）完整版见 `mlk-add-game-module` 必做清单**，此处只列知识模块特有部分：

1. [ ] 复制 `templates/knowledge-content.ts.tmpl` → `content/<topic>.ts`，至少 10 题
2. [ ] 复制 `templates/KnowledgeGame.tsx.tmpl` → `components/games/<Topic>Game.tsx`（通用 4 选 1 壳）
3. [ ] 按 `mlk-add-game-module` 完成模块注册（MODULES / MODULE_META / SLUGS / schema / NODES）

占位符替换：
- `__TOPIC__` → PascalCase（如 `Life`）
- `__topic__` → lowercase（如 `life`）

### 场景 3：考试模式（跨 module）

1. [ ] 创建 `app/(game)/exam/page.tsx`，从 5 个 module 各抽 2 题
2. [ ] 加 30s/题倒计时
3. [ ] 完成后调 `/api/sessions` 写入特殊 module `"EXAM"`，加 prisma 注释
4. [ ] 显示分项正确率（按 module 汇总）

## 反例（不要做）

- ❌ 把新增题目硬编码进组件 — 必须放 `content/`
- ❌ 故事的 questions 写成 2 题或 4 题 — UI 假设固定 3
- ❌ 考试模式直接复用 `MathGame` 等具体游戏 — 用 `KnowledgeGame` 通用壳
- ❌ 给 KnowledgeQuestion 的 answer 字段用字符串 — 必须 index 数字

## 验证

- 类型检查：见 `AGENTS.md` 标准验证。
- 数据完整性：每个新增条目符合 shape（如 `stories.ts` 每个 `story.questions.length === 3`）。
- 体验（见 `mlk-local-dev`）：进 `/world`，新模块/扩充题目可见、可玩。

Last verified against: content/*.ts shapes · 2026-05-27
