# 学习模块返回按钮字体与名句解读播放

- id: `2026-06-19-learning-module-back-font-autoplay`
- status: verified
- commit: pending

## 现象与复现
- 英语岛、诸子百家模块缺少返回按键；需要检查其他模板是否一致。
- 多处字体不一致，返回按键等字号偏小；参考故事书架字体标准统一。
- 诸子智慧 -> 名句卡片，打开卡片后点击经典解读应直接自动播放解读，不需要提问。

## 根因
- 英语岛入口和诸子智慧入口未复用故事书架的共用 `BackButton` 头部模式。
- 诸子智慧阅读/名句子页面使用手写小号文本返回按钮，导致返回入口字号和视觉标准不一致。
- 名句卡“经典解读”打开 `FairyChat` 并传入开场提问 prompt，流程变成问答式解读，而不是直接播放卡片解读文本。

## 修复
- 英语岛、诸子智慧首页补充返回世界的共用 `BackButton`。
- 诸子智慧阅读页、名句卡页改用共用 `BackButton` 返回诸子智慧。
- 提升共用 `BackButton` 字号和字重；英语岛字母歌内部返回按钮改用项目 `Btn`。
- 名句卡“经典解读”改为直接调用 `speakChunks(card.interpretation, { lang: "zh-CN", rate: 0.9 })`，不再打开提问聊天框。

## 回归测试
- 新增 `tests/english/navigation.test.ts` 覆盖英语岛返回世界按钮。
- 新增 `tests/literature/navigation-and-interpretation.test.ts` 覆盖诸子智慧返回按钮和名句解读直接朗读。

## 验证
- `node --test --experimental-strip-types tests/english/navigation.test.ts tests/literature/navigation-and-interpretation.test.ts tests/story/library-navigation.test.ts tests/english/wiring.test.ts`
- `npx tsc --noEmit`
- dev server `http://localhost:3000` 下请求 `/english`、`/literature` 返回 200；未登录请求 `/story` 返回 307 到登录页。
