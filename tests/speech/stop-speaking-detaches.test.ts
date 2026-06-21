import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

// 回归：暂停故事→开精灵→按住说话，西游记又自己响。
// 根因：stopSpeaking 只 pause() 不卸源，被暂停的朗读元素会被 iOS 录音中断结束后的音频会话恢复续播。
// 修复：stopSpeaking 摘回调后卸掉 src（removeAttribute + load），真正停住、无法被恢复。
// 见 bugfix/2026-06-21-paused-story-resumes-on-fairy-record.md。

test("stopSpeaking truly stops the current element so it cannot be auto-resumed", async () => {
  const source = await readFile(new URL("../../lib/speech.ts", import.meta.url), "utf8");

  const fn = source.slice(
    source.indexOf("export function stopSpeaking"),
    source.indexOf("export function stopSpeaking") + 700,
  );

  // 卸掉 src 让被暂停的元素无法被 iOS 会话恢复 / stray play() 续播。
  assert.match(fn, /removeAttribute\("src"\)/);
  assert.match(fn, /\.load\(\)/);
  // 先摘回调，避免卸源触发的 emptied/error 把分段朗读 onerror=advance 误判为跳播下一段。
  assert.match(fn, /\.onerror = null/);
});
