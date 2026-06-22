# iOS 首次授权麦克风后精灵直接误答「没听清」

- id: `2026-06-22-fairy-mic-permission-empty-recording`
- status: fixing
- commit: pending

## 现象与复现
- iPhone 上第一次点「按住说话」→ 弹出麦克风权限框 → 点「允许」后，**还没开口提问**，
  精灵就直接回了「没听清，再说一遍好吗？」。
- 复现：iOS Safari/Chrome 首次进入小精灵语音，点一下麦克风按钮授权 → 允许 → 立刻出现误答。

## 根因
- 按钮 `onPointerDown=startTalk` / `onPointerUp=onPointerLeave=endTalk`（`components/fairy/FairyChat.tsx`）。
- 首次点按：`startTalk → holdSession.begin() → recorder.start()`，而 `createRecorder.start()` 内部
  `await navigator.mediaDevices.getUserMedia(...)`（`lib/speech.ts`）——iOS 此时弹权限框，`start()` 一直挂起，
  **此刻还没有任何音频被采集**（采集用的 ScriptProcessor 在 getUserMedia 之后才接上）。
- 用户为点「允许」松手 → 触发 `endTalk → holdSession.end()`。旧 `end()` 不管录音是否真的开始，
  都安排 `await startPromise + 200ms` 后 `recorder.stop()`。授权完成后 `start()` resolve，于是 stop 拿到
  一小段**空白录音** → `recognizeBlob` 返回空 → 走「没听清」分支。
- 即：**「松手时录音尚未开始」= 首次授权手势**，却被当成一次正常录音去识别。

## 修复
- `components/fairy/holdToTalk.ts`：录音对象加 `started` 标记，`startPromise` resolve 时置真。
  `end()` 进入时若 `!started`（松手时录音还没真正开始 = 授权手势 / 极快误触），**直接丢弃**：
  标记 cancelled、清空 active、待 `start()` 完成后 `recorder.cancel()` 释放麦克风轨道，返回 `null`。
  授权完成后用户再次点击，`start()` 立即 resolve（不再弹框）、松手时 `started` 为真 → 走正常识别逻辑。
  物理上「松手前 start 未 resolve」必然零采集，丢弃不损失任何真实语音。
- `components/fairy/FairyChat.tsx`：按钮补 `onPointerCancel=endTalk`——iOS 权限框夺取焦点时常派发
  `pointercancel` 而非 `pointerup`，统一交给 `end()` 的「未开始即丢弃」逻辑，避免录音卡在 active。

## 回归测试
- `tests/fairy/hold-to-talk.test.ts`：原「release happens before microphone startup finishes 仍提交录音」
  一例改为断言**丢弃**（不 stop、返回 null、授权后 cancel 释放）；其余（200ms 延迟、重复松手去重、
  延迟期取消）保持绿，确认正常录音与去重不受影响。

## 验证
- pending
