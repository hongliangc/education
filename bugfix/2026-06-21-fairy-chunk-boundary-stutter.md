# 精灵长回复分段朗读在 iPhone 上每到段边界仍卡一下

- id: `2026-06-21-fairy-chunk-boundary-stutter`
- status: verified
- commit: this commit

## 现象与复现
- iPhone 上向小精灵语音提问，回复较长时，播到一定字数后会卡顿一下再继续。
- 复现：iOS Safari 打开聊天 → 语音提问一个能触发长回复（> 24 字，被 `splitForTts` 切成多段）的问题 → 听回复，每个分段边界处有明显停顿。
- 之前（abe7d8d）已修过「iOS 能出声/不丢尾音」，但段间卡顿未消除。

## 根因
- `FairyChat` 回复走 `speakChunks`（`FairyChat.tsx:122`）。长文被 `splitForTts` 切段（首段 ≤24、次段 ≤60、其后 ≤148 字，见 `lib/speech/chunking.ts`），故「一定字数」= 分段边界。
- `speakChunks` 预取下一段时把音频灌进**新建的 `new Audio()`**（`fetchAudio`）。iOS Safari 不允许在脱离用户手势的栈里 `play()` 一个「异步之后新建」的元素 → `playFrom` 落入 iOS 兜底分支，把该段改用**唯一的共享播放元素**播放（`shared.src = objUrls[k]` 后 `shared.play()`）。
- 每到段边界都给同一个共享元素重设 `src` → 触发一次 reload / 重新缓冲（未命中缓存的 MSE 段还要重新 attach MediaSource）→ 这就是反复出现的段间卡顿。
- 预取（提前换段）只藏住了**合成**延迟；真正播放的共享元素仍每段 reload，所以 iOS 上卡顿没消。

## 修复
- 用一个 2 元素的**预解锁播放池**替代单个共享元素：`primeSpeechOutput` 在手势里把池中每个元素都点亮。
- `speakChunks` 的 `fetchAudio(k)` 把第 k 段直接灌进 `池[k % 2]`（预解锁 + 提前缓冲），播第 k 段时预取的第 k+1 段落在**另一个**池元素上；段末只需对一个「已解锁、已缓冲」的元素 `play()`，无 reload → 段间无缝。
- 因为播放元素本身已是解锁元素，删掉旧的「换到共享元素重设 src」兜底；`play()` 仍失败才回退整段重合成。

## 回归测试
- 新增 `tests/speech/chunk-pool-prefetch.test.ts`（源码断言，与本仓既有语音测试同风格）：
  - 池至少 2 元素（`AUDIO_POOL_SIZE = 2`）、分段按段序轮流取池元素（`getPooledAudio` / `pool[i % pool.length]`）；
  - `primeSpeechOutput` 点亮池中每个元素（`for (const el of pool)`）；
  - 断言旧的「每段给单个共享元素重设 src」兜底（`shared.src = objUrls[k]`）已删除——三条在修复前都会失败。

## 验证
- `npx tsc --noEmit`：No errors found。
- `node --test`：新测 + chunking / fairy chat-speech / story question-speech / voice-language-match / hold-to-talk / recorder-compat / stt-options / literature navigation 全绿。
- iPhone 实机复测（语音提问长回复，确认段间不再卡顿）：待用户在现网/本地 https 上确认。
