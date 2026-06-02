---
name: mlk-adapt-classic-story
description: Use when adapting or rewriting a classic story into MLK child-reader chapters — 西游记/名著/经典童话 retellings, expanding or rewriting a chapter's narrative text, or adding a new multi-chapter StoryBook. Triggers on "改编 / 改写 / 扩写 / 重写章节 / 西游记 / 名著 / 经典故事 / 加故事书 / 加章节 / 故事太短 / 人物太单薄 / adapt classic story / rewrite chapter / retell". NOT for adding quiz items to non-narrative pools (汉字/字母/单词/算术 → mlk-add-knowledge-pack). NOT for editing the StoryReader/TTS playback (that's the speech subsystem).
---

# 改编经典故事 → 儿童章节

把公有领域名著（《西游记》等）改写成 MLK 的 `StoryBook` 章节。核心：**比传统童话更长、人物有血有肉、适度照进社会现实，但守住 8–10 岁尺度。**

## 何时用 / 何时不用
- ✅ 改写/扩写某本书的某一章正文；统一一本书的风格；新建一本多章长篇
- ❌ 只往汉字/字母/单词/算术题池加条目 → `mlk-add-knowledge-pack`
- ❌ 改朗读/分段/TTS 播放 → 语音子系统，别碰 `lib/speech*`

## 数据落点（唯一真源）
- 类型：`content/storybooks/types.ts` —— `StoryBook → Chapter → StoryQuestion`
- 一书一文件：`content/storybooks/<kebab-id>.ts`，导出常量
- 注册：在 `content/storybooks/index.ts` 的 `STORY_BOOKS` 数组里加上（长篇在前）
- `kind`: 多章名著 = `"novel"`；恰 1 章短篇 = `"tale"`。名著用 `ageBand: "8-10"`

> 篇幅/风格标准以本 skill 为**唯一真源**；`types.ts` 的 `text` 注释只指回这里，别再在代码或 spec 里复写字数。

## 改编四规则（覆盖旧 §3）
1. **篇幅**：每章按**听读 5–10 分钟**设计，正文约 **850–1200 字**。段落用 `\n` 分隔（StoryReader 逐字渲染）。
2. **人物立体**：靠**对话 + 情绪小动作**写出缺点与可爱处，别写"高高在上、一尘不染的圣人"。悟空骄傲/火爆/受委屈仍忠心；唐僧善良但固执、易被外表骗、会错怪人；八戒贪吃/嫉妒/爱挑拨（喜剧担当）。
3. **社会现实与"势力"**：可适度照进现实——等级权术（天宫论资排辈、玉帝拿"齐天大圣"空衔哄人）、有靠山 vs 没靠山的区别对待、自私偏心、强弱之分。让故事可信、有分量、记得住。
4. **守住尺度**：现实点到为止，**不渲染黑暗绝望**；结尾落到能和孩子讨论的道理上（`moral`）。

## 安全底线（不可破）
- 打斗软化：赶跑 / 打回原形 / 打散法术；**不写血腥、不写"打死人"**。
- 用词贴合 `ageBand`，长难句拆短。
- **不要直接抄原著文言**——一律改写成现代儿童口语；`author` 注明 `"根据公有领域《X》改编"`（出处如 ctext.org）。

## 每章结构清单
- [ ] `idx` 0-based 连续、`title`、`emoji`
- [ ] `text` 850–1200 字、`\n` 分段
- [ ] `questions` 2–3 题**递进**，`answer` 是 0-based index 且落在 `choices` 内，每题带 `explain`
- [ ] `moral` 一句话道理

## 范例（已落地，可读全文模仿）
`content/storybooks/journey-to-the-west.ts` 的「三打白骨精」「取得真经」。手法示例——开头用势力现实勾住：石猴出世一章里，大猴子起先嫌他"没爹没娘、石头缝里蹦出来的"，等他探出水帘洞有用了才围上来奉承。这类"对话+偏心"两三句就立住了人物和现实。

## 反例（不要做）
- ❌ 章节仍是 300–600 字的扁平复述
- ❌ 人物全是完美圣人 / 只有打斗没有性格
- ❌ 直接粘原著文言 ／ 不注明改编出处
- ❌ `answer` 写成字符串、`questions` 缺 `explain`

## 验证
- 类型检查：见 `AGENTS.md` 标准验证。
- 字数：逐章 `[...c.text].length` 落在 850–1200；`validateStoryBooks` 是 dev 守卫。

## 提交（共享工作树）
另一个 Claude 可能并发改 `lib/speech*`。**点名提交内容文件**，别 `git add -A`：
```bash
git add content/storybooks/<file>.ts && git commit -m "内容(story): ..."
```

Last verified against: content/storybooks/types.ts · journey-to-the-west.ts · 2026-06-02
