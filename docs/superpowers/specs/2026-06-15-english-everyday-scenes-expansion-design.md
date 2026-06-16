# 英语场景口语扩充：5 个日常场景 + 进阶梯度 设计（pointer stub）

正文见外部 wiki（唯一真源）：
`/mnt/e/workspace/knowledge-wiki/wiki/projects/mlk/specs/2026-06-15-english-everyday-scenes-expansion-design.md`

摘要：水果店单场景扩成 6 场景进阶梯度（👋打招呼 / 🛒水果店 / 🏫学校 / 🦁动物园 / 🎂派对 / 🍜餐厅），句型 `I am`→`I like`→`This is my`→`I can see a`→`Here is a … for you`→`I'd like …, please`，词数 4→6、对话渐长。纯内容扩充 + `EnglishScene` 加 `icon` 字段（替换写死的 🛒）+ 选择器按钮带 icon + 场景测试泛化为遍历 `ENGLISH_SCENES`。不动 schema/后端/alphabet/IPA。
