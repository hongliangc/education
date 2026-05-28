---
name: mlk-audio-speech-recipes
description: Use when adding or modifying sound effects (Web Audio synthesized), text-to-speech (Web Speech API), or word-by-word highlighting in the Magic Learning Kingdom project. Triggers on "加音效 / 加朗读 / 加发音 / 加 TTS / 加点击声 / 答对音 / 听一下 / sound effect / TTS / Web Speech / play sound / read aloud". NOT for adding background music or external audio files — out of project scope.
---

# 音效与语音 Cookbook

## 何时用
- 给游戏新动作加音效（答对、答错、通关、扣血、获得星星）
- 让组件朗读文本（汉字、英文单词、故事）
- 给故事做逐字高亮跟读
- 调整 TTS 语速、音色、断句

## useSFX 11 个具名音效

```ts
import { useSFX } from "@/components/audio/useSFX";

const { sfx } = useSFX();
sfx.correct();   // 答对：C5-E5-G5-C6 上行 arpeggio
sfx.wrong();     // 答错：200→160Hz sawtooth 降调
sfx.coin();      // 拿星星：1568Hz + 2093Hz 双 ping
sfx.fanfare();   // 通关：7 音符序列
sfx.click();     // 一般点击（600Hz 短 sine）
sfx.pop();       // 弹出对话框
sfx.whoosh();   // 切换页面 / 滑动
sfx.pageFlip();  // 翻故事页（3 音降调 triangle）
sfx.word();      // 朗读单字（轻巧 sine）
sfx.unlock();    // 解锁关卡
sfx.heart();    // 扣血提示（440Hz sine）
```

**触发时机约定**：

| 用户动作 | 调用 |
|---|---|
| 答对一题 | `sfx.correct()` |
| 答错一题 | `sfx.wrong()` |
| 通关一轮 | `sfx.fanfare()`（在 GameDone 自动调） |
| 拿星星 | `sfx.coin()` |
| 任意点击按钮 | `sfx.click()`（轻触感反馈） |
| 打开 modal | `sfx.pop()` |
| 翻故事页 | `sfx.pageFlip()` |
| 关卡解锁动画 | `sfx.unlock()` |
| 扣血 | `sfx.heart()` |

## Web Speech API（`lib/speech.ts`）

```ts
import { speakText, stopSpeaking } from "@/lib/speech";

// 简单朗读
await speakText("你好世界", { lang: "zh-CN", rate: 1 });

// 朗读 + 逐字高亮
await speakText("从前有只兔子...", {
  lang: "zh-CN",
  rate: 1,
  onWord: (idx, word) => setHighlight(idx),
  onEnd: () => setPlaying(false),
});

// 停止（unmount / 路由切换时必须调）
stopSpeaking();
```

### lang 选择
- 中文：`zh-CN`（优先 Tingting/Xiaoxiao 音色）
- 英文:`en-US`（优先 Google US 音色）

### rate 三档
- `0.7` — 慢速（低龄/不熟悉的字）
- `1.0` — 中速（默认）
- `1.25` — 快速（已掌握的字、复读）

### 逐字高亮实现
**不能用 `onboundary` 事件**：中文 TTS 引擎大多数不触发 onboundary。改用定时器节奏化：每字 230ms (zh) / 280ms (en)，除以 rate 后定时切 idx。

定时器在 `lib/speech.ts#speakText` 内部实现，调用方只需提供 `onWord` 回调。

## 反例（不要做）

- ❌ `new Audio('/sounds/correct.mp3')` — 本项目零外部音频文件，全 Web Audio 合成
- ❌ 在 useEffect 之外直接调 `getAC()` — AudioContext 首次唤醒需用户交互（已在 `useSFX` 内处理 pointerdown/keydown wake）
- ❌ 在路由切换时不调 `stopSpeaking()` — 上一页朗读会跟到下一页
- ❌ 把 `onWord` 索引当字符串用 — 它是数组 index，配合 `text.split` 出来的 tokens
- ❌ `setInterval(speak, ...)` 在游戏循环里硬调 — TTS 是异步事件，叠加会冲突

## iOS Safari 解锁

`useSFX` 内部已挂监听：首次 `pointerdown` 或 `keydown` 唤醒 AudioContext。**不需要手动调 `unlock()`**，除非要在用户交互前预热（不常见）。

## 验证

1. `npm run dev`，打开任意游戏页，答一题：听到 sfx
2. 进 StoryGame，按"听故事"：
   - 听到中文朗读
   - 字逐个高亮（黄色背景）
   - 暂停按钮可停
3. 切到下一关：朗读应立即停止

Last verified against: lib/speech.ts · components/audio/useSFX.ts · 2026-05-27
