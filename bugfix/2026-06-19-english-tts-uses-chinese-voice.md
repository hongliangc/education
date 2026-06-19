# 英文被中文音色朗读，字母发音错（现网尤甚）

- id: `2026-06-19-english-tts-uses-chinese-voice`
- status: done
- commit: this commit

## 现象与复现
- 字母朗读发音不对：本地仅 A、R；现网 A、E、F、H 等很多，且现网音色与本地不同（本地更好）。
- 复现：现网在 HUD 音色选择器里选过中文音色 → 进英语字母朗读 → 多个字母被中文音色念错。

## 根因
- 音色解析只校验「在白名单内」，不校验「音色语言是否匹配朗读语言」：
  - 客户端 `lib/speech.ts#resolveVoice`：`explicit || getVoicePref() || (zh?ZH:EN)`，
    `mlk:ttsVoice` 偏好对**所有**语言生效，包括英文。
  - 服务端 `server/tts.ts#synthesize`、`server/stream.ts#resolveStreamVoice`：
    `voice && isValidVoice(voice) ? voice : 语言默认` —— 中文音色也照用。
- HUD `VoicePicker` 可把 4 个中文音色之一存成全局偏好；`localStorage` 按 origin 隔离，
  所以现网 origin 存了中文音色、本地 origin 没存 → 现网英文用中文音色念（错+音色不同），
  本地落到 `DEFAULT_VOICE_EN`（WeWinny）→ 基本正确。这解释了本地↔现网差异。

## 修复
- `lib/speech/voices.ts` 新增 `voiceMatchesLang(id, lang)`：按 `TTS_VOICES` 的 `lang` 判匹配。
- 三处音色解析改为「音色语言匹配才采用，否则回落到该语言默认音色」：
  客户端 `resolveVoice`、服务端 `synthesize`、`resolveStreamVoice`。
- 效果：中文内容仍可用所选中文音色；英文内容一律用英文音色（默认 WeWinny），
  且服务端为权威校验，缓存键随之用纠正后的音色，REST/流式两路一致。
- 不在本次处理 RC2（A/R 等字母名拼写在英文音色下的听感微调，需按真人耳朵逐个调）。

## 回归测试
- `tests/speech/voice-language-match.test.ts`：真单测 `voiceMatchesLang`（中文音色不被英文采用、
  反之亦然、未知音色不匹配、默认音色语言正确）+ 源断言三处解析（客户端 resolveVoice 的 explicit/pref、
  服务端 synthesize、resolveStreamVoice）均经 `voiceMatchesLang` 把关。

## 验证
- `npx tsc --noEmit` 通过；新测试 2/2 通过；其余 speech 测试（recorder、stt 热词）通过。
- 注：`tests/speech/chunking.test.ts` 失败为既有问题（其 import 缺 `.ts` 扩展名，与本修复无关）。
- 现网生效需用户 `bash scripts/release.sh prod`：英文内容将一律用英文音色（WeWinny），
  与本地一致；中文内容仍可用所选中文音色。音色听感（A/R 等字母名）属 RC2，另行按耳朵微调。
