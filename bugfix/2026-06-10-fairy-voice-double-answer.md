# 精灵语音问答重复作答（一问两答）

- id: `2026-06-10-fairy-voice-double-answer`
- status: done
- commit: this commit

## 现象与复现
- 在「诸子智慧」名句卡里点「🎙️ 问问精灵」，按住说话问一个问题，松手后：
  - 聊天里出现 2 条相同的用户消息 + 2 条相同的精灵回复；
  - 精灵几乎同时朗读 2 次（语音重叠）。
- 复现：触屏设备（平板/手机）按住麦克风按钮说话再松手。该入口是共享组件 `FairyChat`，故任何用到语音问答的地方都会复现，只是用户在新的文学模块里最先注意到。

## 根因
- `FairyChat` 的麦克风按钮同时绑定 `onPointerUp={endTalk}` 与 `onPointerLeave={endTalk}`（components/fairy/FairyChat.tsx:250-251）。触屏松手时指针不再 hover，浏览器先后派发 `pointerup` 与 `pointerleave`，于是 `endTalk` 在同一轮事件里被同步调用两次。
- `createHoldToTalkSession.end()` 用 `stopPromise ??=` 记忆同一个 stop promise，并且只有等 `recorder.stop()`（含 200ms 延迟）resolve 后才在 `finally` 里清空 `active`（components/fairy/holdToTalk.ts:57-73）。所以两次 `end()` 拿到的是**同一个非空 blob**。
- 两次 `endTalk` 都拿到 blob → 都 `recognizeBlob` → 都 `ask(text)`，产生重复的用户消息、重复的 `/api/fairy/chat` 请求与重复 TTS。

## 修复
- `components/fairy/holdToTalk.ts` 的 `end()` 增加幂等保护：`recording.released` 已为 true 时直接返回 `null`。这样触屏松手派发的第二次 `endTalk` 拿到 `null`，在 `if (!blob) return;` 处直接返回，只提交一份录音。
- 同时把 `stopPromise ??=` 改为 `=`：released 守卫已保证只有首次调用会创建 stop promise，`??=` 的合并语义已无意义。
- 未改 `FairyChat` 的事件绑定：`onPointerLeave` 仍需保留（鼠标拖出按钮即结束的正常 UX）；`useRecordingAudioGuard.restore()` 本身幂等，第二次 handler 的 restore 是无副作用 no-op。

## 回归测试
- `tests/fairy/hold-to-talk.test.ts` 新增：「ignores a duplicate release so one gesture submits the recording once」——`begin()` 后同步调两次 `end()`，断言首次得 blob、第二次得 `null`、`recorder.stop` 只调用一次。修复前第二次会返回同一个 blob → 测试失败；修复后通过。

## 验证
- `npx tsc --noEmit` → No errors found。
- `node --test tests/fairy/hold-to-talk.test.ts` → 4/4 通过。
- 全量 `node --test`：36/37 通过；唯一失败 `tests/speech/chunking.test.ts` 为本次改动之前就存在的失败（与语音分段相关，未触碰），不在本 bug 范围内。
- 未改 API 路由，无需 401 复验。
