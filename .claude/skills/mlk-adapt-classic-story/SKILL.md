---
name: mlk-adapt-classic-story
description: Use when adapting/rewriting a public-domain classic for MLK — 叙事名著章节（改编/改写/扩写/西游记/名著/经典故事）或诸子思想内容（庄子寓言/老子孔孟名句/经典原文精读/诸子百家）. NOT for quiz pools (→ mlk-add-knowledge-pack) or StoryReader/TTS playback.
---

# 改编经典 → 儿童内容

公有领域经典改写成 MLK 内容。**两类经典、两套规则，不可互相套用：**

- **A 叙事名著**（《西游记》等故事）：靠"长 + 人物立体 + 照进现实"勾人。
- **B 诸子思想**（庄子寓言、老子/孔孟名句）：**言简意赅、通俗易懂**，以理为主、宁短勿水。

## 何时用 / 何时不用
- ✅ 改写名著某章 / 统一一本书风格 / 新建多章长篇 → 走 **A**
- ✅ 写庄子寓言、诸子名句、经典原文精读 → 走 **B**
- ❌ 只往汉字/字母/单词/算术题池加条目 → `mlk-add-knowledge-pack`
- ❌ 改朗读/分段/TTS 播放 → 语音子系统，别碰 `lib/speech*`

---

## A 叙事名著（落点 `content/storybooks/`）

**数据落点（唯一真源）**
- 类型：`content/storybooks/types.ts`（`StoryBook → Chapter → StoryQuestion`）
- 一书一文件 `content/storybooks/<kebab-id>.ts`；注册进 `index.ts` 的 `STORY_BOOKS`（长篇在前）
- `kind`：多章=`"novel"` / 单章短篇=`"tale"`；名著用 `ageBand: "8-10"`

**四规则**
1. **篇幅**：每章按听读 5–10 分钟设计，正文约 **850–1200 字**，`\n` 分段（StoryReader 逐字渲染）。
2. **人物立体**：对话 + 情绪小动作写出缺点与可爱处，别写圣人。悟空骄傲/火爆仍忠心；唐僧善良固执、易被外表骗；八戒贪吃嫉妒（喜剧担当）。
3. **社会现实与势力**：适度照进现实（等级权术、有无靠山的区别、偏心、强弱），让故事可信、记得住。
4. **守尺度**：现实点到为止，不渲染黑暗绝望；结尾落到能和孩子讨论的 `moral`。

**每章清单**
- [ ] `idx` 0-based 连续、`title`、`emoji`
- [ ] `text` 850–1200 字、`\n` 分段
- [ ] `questions` 2–3 题**递进**，`answer` 是 0-based index 且落在 `choices` 内，每题带 `explain`
- [ ] `moral` 一句话道理

**范例 / 反例**
- 范例：`content/storybooks/journey-to-the-west.ts`「三打白骨精」「取得真经」。开头用势力现实勾住：石猴出世一章，大猴子先嫌他"石头缝里蹦出来的"，等他有用了才围上奉承——两三句立住人物和现实。
- 反例：❌ 300–600 字扁平复述 ／ ❌ 全是完美圣人、只有打斗没性格

---

## B 诸子思想（落点 `content/classics/`）

**核心：言简意赅、通俗易懂——把道理讲清楚，让孩子能理解、记得住。** 篇幅随内容定：该展开就展开（补历史典故、人物背景、关联上下文帮助理解），该收就收。**"言简意赅"指没有水分、句句有用，不是越短越好**——既不为凑字数注水，也不强压成干巴巴的一两句。三种形态：

1. **寓言 tale**（`parables.ts`，如庄子「井底之蛙」）：仍是单章 `StoryBook`，以把哲思讲透为准；篇幅按需要伸缩，**不套 A 的 850–1200 字硬指标**。
2. **名句卡**（`decks.ts`，老子/孔子/孟子）：`meaning` 白话点题、`interpretation` 把道理说清说透（讲明白为准，不堆术语、不灌水）；可在 `interpretation` 里带上相关典故/出处背景，关键字/词放 `glossary`。
3. **经典原文版**（`classicTexts.ts`）：取公有领域（ctext.org）**精选名段**，逐句配白话直译 + 就近 `notes`（字/词/典故）。这是"读原文"层，与改编版并存、阅读页切换——**此处保留原文言**（A 的"不抄文言"只管叙事改编版）。

---

## 安全底线（两类都守）
- 打斗软化：赶跑 / 打回原形 / 打散法术；**不写血腥、不写"打死人"**。
- 用词贴合 `ageBand`，长难句拆短。
- **叙事改编版（A）不抄原著文言**，一律现代儿童口语；`author` 注明 `"根据公有领域《X》改编"`（出处如 ctext.org）。经典原文版（B-3）例外。

## 验证
- 类型检查：见 `AGENTS.md` 标准验证。
- A 字数：逐章 `[...c.text].length` 落在 850–1200；`validateStoryBooks` 是 dev 守卫。
- B：`content/classics/index.ts` 的 dev 守卫校验寓言 / 卡组 / 经典原文。

## 提交（共享工作树）
另一个 Claude 可能并发改 `lib/speech*`。**点名提交内容文件**，别 `git add -A`：
```bash
git add content/storybooks/<file>.ts   # A
git add content/classics/<file>.ts     # B
```

Last verified against: content/storybooks/types.ts · journey-to-the-west.ts · content/classics/ · 2026-06-11
