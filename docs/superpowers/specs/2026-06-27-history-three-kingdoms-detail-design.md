# 三国详情页（朝代详情页 UI + 5 层派生机制） — 设计 spec

正文在 wiki：[[projects/mlk/specs/2026-06-27-history-three-kingdoms-detail-design]]

绝对路径：`E:\workspace\knowledge-wiki\wiki\projects\mlk\specs\2026-06-27-history-three-kingdoms-detail-design.md`

要点：点三国封面 → 朝代详情页（听故事/群英谱/大事件/地图/任务 5 Tab）。**整页是阅读进度的富视图**——机制全部由 `/api/reading` 的 `completedChapters` + 每章 `cardKeys` 纯函数派生，**零新表/接口**。群英谱本期用试点子集（~20/40，框架支持全量）。

关联：
- [[projects/mlk/specs/2026-06-24-history-three-kingdoms-design]]（Plan 1；本 spec **取代**其卡片收集子系统：弃用雷达/考验/金卡/`HistoryCardUnlock`/`/api/history/*`，改派生自阅读进度。Plan 1 的故事+阅读流/演义史实小卡/历史向导精灵原样复用）。
