# iPhone 上小精灵语音首段延时 1s+（PC 首段很快、段间已无 gap）

- id: `2026-06-22-fairy-ios-first-segment-latency`
- status: fixing
- commit: pending

## 现象与复现
- iPhone Chrome（= WebKit/Safari 引擎）现网：小精灵语音回复**首段**有 1s 多延时。
- 段间已无 gap（上一轮 `fairy-uncached-chunk-gap` 改单条流式后解决）。
- 同一回复在 PC Chrome 上首段响应很快。
- 复现：iPhone 现网向小精灵提问 → 听回复，首声明显比 PC 慢。

## 根因
- 首段延时由两段叠加：
  1. **腾讯大模型 WS 首帧 ~0.6–1s**（`lib/speech/server/stream.ts`：握手→ready→ACTION_SYNTHESIS→首个 mp3 帧）。
     回复文本每次唯一→必然缓存未命中→必走实时合成。此为硬地板，PC/iPhone 相同。
  2. **iOS 原生 `<audio>` 启动缓冲 ~0.3–0.5s**，叠加在地板之上。
- iPhone-only 的差值来自播放路径：iPhone Safari 无 `MediaSource("audio/mpeg")`（`canMse=false`，`lib/speech.ts:576`）
  → 走原生 `<audio src=stream>` 边下边播；首帧到达前设备**收不到任何字节**，管线 0.8s 后才开始预热，再加原生启动缓冲。
- PC 有 MSE：客户端 `fetch` 读流，首个 append 帧即起播，无原生启动停顿 → 「PC 快、iPhone 慢」的根因。
- WebKit（桌面 + iOS）的 MSE 都不支持 `audio/mpeg`，所以不能简单让 iPhone 复用 PC 的 MSE 路径。

## 修复
- 方向（经用户确认）：**暖管线·前导静音**——服务端在腾讯真实首帧到达前持续下发静音帧喂活 iOS
  原生 `<audio>` 播放管线，真实首帧一到即无缝切真声，省掉 iOS 冷启动那一截（~0.3-0.5s）并消除「卡死」感。
  腾讯首帧硬地板（~0.8s）不变。
- `lib/speech/server/stream.ts`：
  - 抽出 `silentFrames(n)`（尾部静音 `SILENCE_MP3` 与前导静音共用同一帧生成器）。
  - 新增前导静音常量 `LEAD_IN_CHUNK`（每口 4 帧 ≈ 144ms）、`LEAD_IN_TICK_MS=120`（略快于实时、留薄余量防欠载又不堆积过多延时）。
  - `synthesizeStream`：仅 `pad=1`（iOS 原生路径）时，从 **WS `ready`**（握手已成、合成已请求）起 `setInterval`
    持续 `enqueue(LEAD_IN_CHUNK)`；收到**第一帧真声**即 `firstReal=true` 并 `stopLeadIn()`，真声紧跟其后无缝衔接。
  - `finish()` / `cancel()` 都 `stopLeadIn()`，无泄漏。前导静音只 `enqueue`、不进 `parts` → **不污染缓存**。
- 关键取舍：前导静音起点选 `ready` 而非建流。握手前的失败（未配置/网络/握手拒绝）此时 `currentTime` 仍为 0，
  客户端 `onerror` 仍能正常回退 Web Speech；仅「ready 之后、首帧之前」的罕见腾讯 code 错误会落入「已出声」分支
  而失去本次回退（UI 经 onEnd 仍恢复，用户重问即可）——窄口、可接受。
- 客户端无改动：happy path 不变；PC（MSE，不带 pad）不受影响、不会被前导静音拖慢。

## 回归测试
- `tests/speech/stream-shared-element.test.ts` 新增断言：前导静音复用 `silentFrames`、仅 `pad && !leadIn && !firstReal`
  下发、`enqueue(new Uint8Array(LEAD_IN_CHUNK))`、首帧到达即 `firstReal = true; stopLeadIn();`、`cancel()` 清定时器。
- 既有 `SILENCE_MP3` 尾部静音断言（帧头 0xf3/0xc0、仅 pad、不进缓存）仍绿——确认 `silentFrames` 重构未破坏尾部静音。

## 首段延时拆解（实测，warm pipeline 之后仍慢的二次排查）
- 加了服务端 `[tts-timing]` 日志（`stream.ts`：记录建流起 open/ready/first/synth→first 各段 ms），
  并用一次性脚本 `/tmp/tts-probe.mjs`（与 `buildSignedUrl`/协议逐字一致）从本地直连腾讯 WS 实测 5 次：
  ```
  run1(冷) open=718 ready=751 first=1256 synth->first=505   ← 进程首连：DNS+全新 TLS
  run2     open=237 ready=291 first=455  synth->first=164
  run3     open=274 ready=316 first=534  synth->first=218
  run4     open=281 ready=321 first=535  synth->first=214
  run5     open=270 ready=314 first=490  synth->first=176
  ```
- 结论：**瓶颈在「腾讯获取延时」的连接握手段，不是 iOS 播放。**
  - 模型真实首帧 `synth→first` 仅 ~190ms（warm），是不可压的地板。
  - 到首帧的大头是**建连**：`open`（TCP+TLS+WS 升级）~270ms（warm）/ ~720ms（冷首连），`ready` 再 +~45ms。
  - 每次小精灵回复都 `new WebSocket()`（无连接复用）→ 每次都付一次完整握手。iOS 端因暖管线已在播，
    真实首帧一到即出声，不是延时来源。
- **关键局限**：本地是 WSL/家庭网络直连腾讯公网；现网服务器是腾讯云 Lighthouse（同云内网到 `tts.cloud.tencent.com`），
  握手大概率显著更低。真实现网数字须看部署后的 `[tts-timing]` 日志（`docker compose -p education logs --since=3m web | grep tts-timing`）。
- 优化方向（待现网数字确认后实施）：把建连移出关键路径——在小精灵这一轮**生成回复文本期间预热 WS 到 ready**，
  文本就绪即发 ACTION_SYNTHESIS，只剩 ~190ms 模型地板 + 网络。预期首声从 ~1s+ 降到 ~300-400ms。

## 端到端「总等待」拆解（提问→听到声音）
- 首句出声前的真正大头是 **LLM 生成回复**（`/api/fairy/chat`），不是 TTS（TTS 首帧 ~500ms 已是地板）。
- 新增埋点把整条链拆开：
  - 服务端 **`[fairy-chat] llm=… total=…`**（`app/api/fairy/chat/route.ts`）——LLM 生成耗时与整段处理耗时，**常开**，无需开关。
  - 服务端 `[tts-timing]`——TTS 取流/首帧（已有）。
  - 客户端 **`[tts-perf] {kind:"turn", stt, llm, play, total}`**——`FairyChat` 在「首个有声样本」时上报
    端到端总等待及各段（STT 语音转文字 / LLM / TTS 取流到播放）。经 `speakTextStream` 新增的 `onFirstAudio`
    回调触发，仅 `?ttsperf=1` 时发。
- 总等待 ≈ STT（仅语音）+ LLM + TTS 首字节(~500ms) + 播放启动；据现网日志可逐项坐实瓶颈。

## 验证
- `npx tsc --noEmit`：No errors found（含本次 `[tts-timing]`/`[fairy-chat]` 日志与 onFirstAudio 埋点）。
- `node --test tests/speech/*.test.ts`：17 通过、0 失败（`firstReal = true; stopLeadIn();` 邻接断言未破坏）。
- iPhone 实机复测（现网 https 向小精灵提问，确认首段比之前更快出声、首帧前无「卡死」、真声前后无杂音/欠载停顿）：
  待用户在现网确认。若首段仍有欠载停顿（静音喂不上），调小 `LEAD_IN_TICK_MS` 或调大 `LEAD_IN_TICK_FRAMES`；
  若真声前残留静音偏长（延时反而增加），反向微调。
