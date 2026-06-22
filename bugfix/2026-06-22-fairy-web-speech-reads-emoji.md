# 浏览器原生 Web Speech 回退把回复里的 emoji 念出来（机械音读 emoji）

- id: `2026-06-22-fairy-web-speech-reads-emoji`
- status: done
- commit: this commit

## 现象与复现
- 精灵语音回答有时是「机械发音」，且会把 emoji 念出来（如「✨」读成 "sparkles"）。
- 复现：本地未配置腾讯云 TTS（或某次合成失败）→ 朗读回退浏览器 Web Speech →
  回复几乎都含 emoji → 原样念出。

## 根因
- emoji 净化（`sanitizeForTts`）只在服务端腾讯云路径（`lib/speech/server/stream.ts`）做。
- 客户端回退 `speakText` → `fallbackWebSpeech` 直接 `new SpeechSynthesisUtterance(text)`，
  用的是**含 emoji 的原始文本** → Web Speech 把 emoji 读成名字。

## 修复
- `lib/speech.ts` 新增 `sanitizeForSpeech(text)`（与服务端 `sanitizeForTts` 同规则：剔
  `\p{Extended_Pictographic}` / 变体选择符 / ZWJ / keycap / 区域指示符，收敛空白）。
- `fallbackWebSpeech` 用净化后的副本建 utterance；净化后为空（纯 emoji，极罕见）则直接收尾、
  不空播。气泡展示文本不变（照常显示 emoji），只净化送朗读的副本。
- 「机械发音」本身是 Web Speech 回退（本地无腾讯 Key），配好 TTS 即真人童声——非本 bug 范围。

## 回归测试
- `tests/speech/web-speech-emoji.test.ts`：断言存在 `sanitizeForSpeech`、用
  `\p{Extended_Pictographic}`、Web Speech 朗读的是净化后的 `spoken`。

## 验证
- `npx tsc --noEmit` 通过；`node --test` 全套通过。
