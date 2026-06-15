# 英语模块新增「字母 & 音标」分类（26 字母 + 完整国际音标 IPA） 设计

→ 正文在 wiki：`[[projects/mlk/specs/2026-06-13-english-alphabet-ipa-category-design]]`
→ 绝对路径：`E:\workspace\knowledge-wiki\wiki\projects\mlk\specs\2026-06-13-english-alphabet-ipa-category-design.md`

英语模块升级为多分类 hub，新增「🔤 字母 & 音标」分类：26 字母表（复用 `phonics.ts#LETTER_WORDS`）+ 完整国际音标（中式 48 音素 = 20 元音 + 28 辅音，分 7 组）。沿用「点读 + 🎤 跟读·鼓励优先·永不卡关」，复用 `SpeakPanel`/`match`/`encourage`/`GameDone`。关键约束：TTS 读例词不读裸音标符号。纯前端、零侵入现有 words/phonics/scene。执行交 Codex，Claude 出方案 + CR。
