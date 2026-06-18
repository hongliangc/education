# 精灵语音输入：按住即跳到打字框，无法录音

- id: `2026-06-18-fairy-voice-input-jumps-to-typing`
- status: done
- commit: this commit

## 现象与复现
- 进入精灵对话（世界地图点精灵 / 文学语句解读等），按住「🎤 按住说话」会立刻跳到打字输入框，录不了音。
- 手机走 http（局域网 IP / 生产 IP）复现；电脑 `localhost` 也复现（用户确认）。

## 根因
- `FairyChat.startTalk`（`components/fairy/FairyChat.tsx`）→ `holdSession.begin()` → `createRecorder().start()` → `navigator.mediaDevices.getUserMedia()`（`lib/speech.ts`）。
- 该调用抛错时，`startTalk` 的 `catch` **静默** `setTyping(true)`，且 catch **吞掉真实错误（无日志）**，所以表现为「按住就跳打字、不知为何」。
- 抛错来源两类：
  1. **非安全上下文**：手机走 http（非 localhost）时 `navigator.mediaDevices` 为 `undefined`，`getUserMedia` 直接抛 —— 浏览器安全策略，麦克风必须 https/localhost。
  2. **安全上下文（localhost/https）下 getUserMedia 被拒**：权限被拒绝/未授予（`NotAllowedError`，在 localhost 上是粘性的）、无麦克风设备（`NotFoundError`）、或 `AudioContext` 不可用（如 iOS 仅有 `webkitAudioContext`）。
- 当前代码把以上所有情况折叠成「静默切打字」，既不能用又不解释。

## 修复
- 去掉静默吞错：catch 中 `console.warn` 真实 error。
- 进 `begin()` 前预检 `window.isSecureContext` 与 `navigator.mediaDevices?.getUserMedia`（`microphonePreflightMessage()`）；缺失 → 明确提示并切打字。
- `begin()` 抛错按 `error.name` 区分提示，且对权限类错误**保留麦克风按钮可重试**（不永久锁进打字）：`NotAllowedError`/`SecurityError` → 「请在地址栏允许麦克风后重试」并保留麦克风按钮；`NotFoundError`/`OverconstrainedError` → 「没找到麦克风，已切到打字」；其他 → 通用提示 + 切打字。
- 提示以一行 hint 呈现：`{voiceHint ?? HINT[status]}`。
- `createRecorder` 增加 `getAudioContextConstructor()`：支持 `webkitAudioContext` 兜底（iOS Safari），不可用时抛明确错误。
- 注：未改 `SpeakPanel.tsx`（英语跟读），其已有「👍 我说好了」无麦克风兜底。

## 回归测试
- `tests/fairy/chat-speech.test.ts`：错误分支显示具体 hint 且权限错误可重试。
- `tests/speech/recorder-compat.test.ts`：标准 `AudioContext` 缺失时走 `webkitAudioContext`。

## 验证
- `npx tsc --noEmit` 通过。
- `node --experimental-strip-types --test tests/fairy/chat-speech.test.ts tests/speech/recorder-compat.test.ts` 通过。
- localhost 实测按住：确认出现**具体原因提示**（而非空跳打字）；把出现的 `error.name` 反馈，确认是权限态（已处理）还是更深 bug。
- 备注：真正在手机上启用语音需 https（本地测试用 cloudflared 隧道；生产需 TLS/备案）。这是环境前提，非本次代码可解。

## 实际改动文件
- `components/fairy/FairyChat.tsx`
- `lib/speech.ts`（`createRecorder` 的 `AudioContext`/`webkitAudioContext` 兜底）
- `tests/fairy/chat-speech.test.ts`
- `tests/speech/recorder-compat.test.ts`
