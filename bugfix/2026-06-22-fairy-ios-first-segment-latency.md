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

## 验证
- `npx tsc --noEmit`：No errors found。
- `node --test tests/speech/*.test.ts tests/fairy/*.test.ts`：32 通过、0 失败。
- iPhone 实机复测（现网 https 向小精灵提问，确认首段比之前更快出声、首帧前无「卡死」、真声前后无杂音/欠载停顿）：
  待用户在现网确认。若首段仍有欠载停顿（静音喂不上），调小 `LEAD_IN_TICK_MS` 或调大 `LEAD_IN_TICK_FRAMES`；
  若真声前残留静音偏长（延时反而增加），反向微调。
