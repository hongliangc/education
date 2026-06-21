# 小精灵回复首句有延迟、短句后下一句卡顿 1s+（故事却完全流畅）

- id: `2026-06-21-fairy-uncached-chunk-gap`
- status: done
- commit: this commit

## 现象与复现
- iPhone 现网：听《西游记》故事完全流畅，无首句延迟、无段间 gap，文本 > 800 字也一样。
- 但小精灵语音回复：首句有明显延迟；播完很短的首句（几个字）后，下一句卡顿 1s 多。
- 复现：iOS 上向小精灵语音/文字提问 → 听回复，首句慢且段边界处停顿。

## 根因
- `tts-stream` 端点是**缓存优先**：命中 `sha256(lang|voice|text)` 直接整段下发（~7ms）；未命中才开腾讯云 WS 实时合成（首帧 ~0.6–1s）。
- 故事文本固定，被反复收听 → 每段都是**缓存命中**，瞬时返回 → 无首句延迟、无段间 gap，与长度无关。
- 小精灵回复是 LLM 每次**唯一**的文本 → 每段都是**缓存未命中**，每段都要实时合成。
- `FairyChat` 走 `speakChunks`，按 `chunkCap` 把回复切成 首段≤24、次段≤60、其后≤148 字。对未命中的回复，
  客户端在**每个段边界**都要等一次 ~1s 的实时合成；而首段太短（几个字、~1s 播完）盖不住下一段的合成耗时
  → 首句延迟（首段未命中合成）+ 段间卡顿（次段合成没赶上）。
- 关键：分段的唯一收益是**逐段缓存**，但小精灵回复永不重复 → 分段对它毫无收益，只徒增「每段一次未命中延迟」的边界。
- 旁证：`abe7d8d` 时小精灵本来就是「共享元素播腾讯流式音频」（单条流式），后来 `c08238c` 改成 `speakChunks`
  解决长回复段间 reload 卡顿，却把「单条流式」换成了「多段」，引入了上面这条未命中边界 gap。

### 更深一层（PC 流畅、iPhone 才卡的真正原因）
- 复测：**PC 浏览器上小精灵对话完全无延迟、无停顿**；只有 iPhone 卡。差异点在 `canMse`：
  `typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg")`。
- iPhone Safari **没有可用的 MediaSource(audio/mpeg)** → `canMse=false` → `speakChunks`/`speakTextStream`
  都走 **`await res.blob()` 整段下完再播** 的分支。PC 有 MSE → 渐进边收边播 → 流畅。
- 于是 iPhone 上：缓存命中(故事)=整段文件秒回→瞬时、无 gap；缓存未命中(精灵)=`.blob()` 要等**整段实时
  合成完**才出声 → 首句延迟 + 每段未命中 → 段间卡顿。这正是「PC 好、iPhone 坏」的根因。
- 注意：仅把精灵换成单条 `speakTextStream` 在 iPhone 上会让首句**更慢**（一次 `.blob()` 等整段回复合成完）。
  真正要解决 iOS 实时性，必须避开「整段下完再播」。

## 修复
- 小精灵回复改回**单条连续流式** `speakTextStream`（整段一次 WS 合成、MSE 渐进边收边播）：
  未命中延迟只在最开头付一次（= 不可避免的首声延迟），之后无段边界 → 中途不再有 gap。
  腾讯 `TextToStreamAudioWSv2` 单次 `ACTION_SYNTHESIS` 接受整段文本（无 REST 的 150 字上限），整段流式没问题。
- `speakTextStream` 此前用脱离手势新建的 `new Audio()` 播放（iOS 会拦 → 回退整段 REST，慢且可能截断）。
  改为复用**手势内已解锁的共享池元素** `getSharedAudio()`（与 `speakText` 一致），iOS 上可直接编程 play。
  这同时修了数学讲解（也走 `speakTextStream`）在 iOS 上的同类隐患。
- 故事/名句/数学讲解仍各自沿用原函数：故事长文走 `speakChunks`（逐段缓存对反复收听有收益、命中即无 gap）。

### iOS 实时性修复（无 MSE 路径改原生边下边播 + 静音尾巴）
- `speakTextStream` 的 `!canMse` 分支：**不再 `await res.blob()` 整段下完**，改为把流式端点 URL 直接设给
  已解锁的共享 `<audio>`（`prepShared(\`${url}&pad=1\`)` + `attach`），由浏览器原生**边下边播**：
  首声快、整段无 gap，iPhone 体验对齐 PC。取流失败(503/网络)走 `onerror` → 回退整段 `speakText`。
- Safari 对**无 Content-Length 的流会掐掉末尾几个字**（旧「丢尾音」根因）。`pad=1` 时服务端在合成结束后
  追加 ~0.5s 静音 MP3（`SILENCE_MP3`，MPEG-2 LIII 16kHz 与腾讯流同格式，帧头 FF F3 48 C0 + 全 0）：
  被掐掉的是静音而非真正结尾。静音**不写缓存**（命中缓存走整段下发带 Content-Length，本就不丢尾音）。
- 链路：客户端 `!canMse` 时请求 `&pad=1` → 路由读 `pad` → `synthesizeStream({pad})` → final 后 enqueue 静音。

## 回归测试
- `tests/fairy/chat-speech.test.ts`：断言小精灵改用单条流式 `speakTextStream`、不再用 `speakChunks`（翻转原断言）。
- `tests/speech/stream-shared-element.test.ts`：①`speakTextStream` 用共享池元素 `prepShared(objUrl)`、不再 `new Audio(objUrl)`；
  ②无 MSE 时走原生边下边播 + `&pad=1`；③服务端按需追加 `SILENCE_MP3`、不进缓存；④路由把 `pad` 透传给合成器。
- `tests/speech/chunk-pool-prefetch.test.ts` 仍绿：故事仍走 `speakChunks` 池预取，未受影响。

## 验证
- `npx tsc --noEmit`：No errors found。
- `node --test tests/speech/*.test.ts tests/fairy/*.test.ts tests/literature/*.test.ts`：33 通过、0 失败。
- iPhone 实机复测（小精灵语音/文字提问，确认首句快、整段连续、**末尾几个字不被掐**）：待用户在现网 https 上确认；
  若仍掐尾，调大 `SILENCE_MP3` 帧数（当前 14 帧 ≈ 0.5s）。
