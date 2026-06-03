# Batch B2 — 故事导入与改编流水线设计（指针）

正文在 wiki：[[projects/mlk/specs/2026-05-31-batch-B2-story-import-design]]

绝对路径：`E:\workspace\knowledge-wiki\wiki\projects\mlk\specs\2026-05-31-batch-B2-story-import-design.md`

一句话：开发期 CLI 流水线（`parse → adapt → emit`），把 TXT/文本PDF/EPUB 公有领域文学导入为 B1 的 `StoryBook` 内容——自动分章、按需 AI 改编或保留原文、两道人工审核闸门，中间态 `StoryDraft` JSON 为将来应用内导入预留契约。

关联：
- 依赖 spec：[[projects/mlk/specs/2026-05-29-batch-B1-design]]
- 关联 plan：[[projects/mlk/plans/2026-05-30-batch-B1-plan]]
