# 精灵/朗读文本含 emoji 触发腾讯 TTS code 20002，缓存从未生效、流以错误收尾

- id: `2026-06-22-fairy-tts-emoji-ssml-invalid`
- status: fixing
- commit: pending

## 现象与复现
- 现网 `[tts-timing]` 日志显示**每条**流式合成都 `err=1`，腾讯返回
  `code 20002: 后台引擎合成失败 … InvalidParameterValue.SSMLInvalid: text hasn't valid words or has invalid words`。
- 音频前半段正常下发（几十~上百帧都到了），错误出现在末尾。
- 复现：iOS/PC 现网正常问小精灵任意问题（回复常带 emoji）→ 听到回复，但服务端日志每条都 20002。

## 根因
- 小精灵回复（LLM 文本，`FairyChat.ask` → `speakTextStream`）直接整段送腾讯大模型流式 TTS
  （`lib/speech/server/stream.ts` 的 `ACTION_SYNTHESIS data: text`）。儿童 app 回复几乎都含 **emoji**
  （连兜底串都是「…再问我一次好吗？✨」）。腾讯对含 emoji / 纯符号的段判 `SSMLInvalid (20002)`。
- 后果（两条都被本次延时排查的新日志暴露，实为早存在）：
  1. 错误使 `final=1` 永不下发 → `writeTtsCache` 从不执行 → **流式 TTS 实际从未缓存**：
     每次重听 / 重复内容都重新实时合成、白付 ~500ms 首帧地板、白扣额度。
  2. `controller.error` 使响应体以错误收尾：iOS 靠 pad 静音尾、PC 靠已播完勉强兜住，但不干净，
     且可能截断结尾。
- 与首段延时无直接因果（首帧 ~500ms 是模型地板），但显著拖累「重复/重听」体验，是独立真 bug。

## 修复
- `lib/speech/server/stream.ts`：新增 `sanitizeForTts(text)`，剔除 emoji（`\p{Extended_Pictographic}`）、
  变体选择符 / ZWJ / keycap、区域指示符（国旗），并收敛空白。`synthesizeStream` 用净化后的 `ttsText`
  送 `ACTION_SYNTHESIS`；净化后为空（纯 emoji 回复，极罕见）则直接收流，由客户端回退。
- **缓存键仍用原始 text**（读写两侧一致）：命中的是该回复对应的干净音频，无需改动路由读缓存逻辑。
- 展示文本不变（前端气泡照常显示 emoji），仅净化送 TTS 的副本。

## 回归测试
- `tests/speech/stream-shared-element.test.ts` 新增断言：存在 `sanitizeForTts`、用 `\p{Extended_Pictographic}`、
  `ACTION_SYNTHESIS` 送的是 `ttsText`（净化后）而非原始 `text`。

## 验证
- pending（部署后看现网 `[tts-timing]` 是否 `err=1` 消失、`final` 正常、缓存开始命中）。
