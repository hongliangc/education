# 暂停西游记故事后开精灵按住说话，西游记语音又自己播了

- id: `2026-06-21-paused-story-resumes-on-fairy-record`
- status: done
- commit: this commit

## 现象与复现
- iPhone：听西游记故事 → 暂停 → 打开小精灵 → 按住说话（开始录音）→ 西游记语音绘本朗读又自己响起来。
- 复现：故事页点「⏸ 暂停」→ 打开精灵 → 按住说话即可。

## 根因
- 故事朗读 `speakChunks` 用共享池元素播放，并把它记到模块级 `currentAudio`；故事「暂停」只 `pause()`
  该元素，**不清 `currentAudio`**，元素保留 src + 播放位置。
- 精灵「按住说话」`startTalk` → `stopSpeaking()`，而 `stopSpeaking` 当时**只 `pause()`**：被暂停的
  故事元素仍持有 src 与进度，可被恢复。
- 录音 `createRecorder` 开 `getUserMedia` + `AudioContext`（接到 destination）。iOS 上这是一次音频会话
  「中断」；录音结束、会话恢复时，iOS 会**自动续播中断前被暂停的媒体元素** → 故事元素带着旧 src 被
  iOS 恢复播放（同理任何对该元素的 stray `play()` / BGM kick 也会触发）。
- 本质：故事与精灵共用同一套全局池元素 + `currentAudio`，而 `stopSpeaking` 名为「清场」却没真正停住
  （只暂停、不卸源），于是暂停的故事能被恢复。

## 修复
- 让 `stopSpeaking()` 名副其实地「停住」：先摘掉元素回调（onended/onerror/onplay）再 `pause()`、再卸掉
  `src`（`removeAttribute("src")` + `load()`）。卸源后 iOS 会话恢复 / stray play 都无源可播，故事不再自己响。
- 先摘回调再卸源：清空 src 会触发 emptied/error，若留着分段朗读的 `onerror=advance` 会被误判为「本段
  出错」而自动跳播下一段，反而又出声。
- `stopSpeaking` 本就用于「开播新朗读前清场 / 切场景」，之后的朗读都会重新设 src，卸源对正常流程无副作用。

## 回归测试
- 新增 `tests/speech/stop-speaking-detaches.test.ts`：断言 `stopSpeaking` 先摘回调（`onerror = null`）再
  卸源（`removeAttribute("src")` + `load()`），真正停住、无法被恢复。

## 验证
- `npx tsc --noEmit`：No errors found。
- `node --test tests/speech/*.test.ts tests/fairy/*.test.ts tests/literature/*.test.ts`：34 通过、0 失败。
- iPhone 实机复测（暂停故事→开精灵→按住说话，确认西游记不再自己响）：待用户在现网 https 上确认。
