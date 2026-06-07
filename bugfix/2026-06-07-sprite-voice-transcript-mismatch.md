# 小精灵语音与转写文字不匹配

- id: `2026-06-07-sprite-voice-transcript-mismatch`
- status: done
- commit: this commit

## 现象与复现
- 与小精灵语音对话时，用户按下说出的语音和实际返回的文字不匹配。
- 进入小精灵语音对话，按住说话并提交，比较原始语音内容与界面返回文字。

## 根因
- 腾讯一句话识别使用通用 `16k_zh` 且未携带业务热词，产品词容易被识别为更常见的同音词。
- 录音启动需要异步等待麦克风权限，但松手处理依赖事件闭包中的 React `status`。若松手早于 `setStatus("listening")` 生效，松手事件会被忽略，造成录音轮次卡住或错位。
- 背景音乐在录音期间继续播放，设备扬声器声音会被麦克风重新采集；浏览器 `echoCancellation` 不能保证完全消除音乐。
- 麦克风启动完成后播放的点击提示音也会被当前录音直接收进去。

## 修复
- 中文 ASR 请求增加“小精灵、魔法学习王国、星星”临时热词，并支持环境变量覆盖识别引擎和热词。
- 使用独立按住说话会话管理录音启动/松手，松手可等待尚未完成的麦克风启动并停止同一轮录音。
- 录音开始前临时暂停当前 BGM，识别完成、失败或弹窗关闭时恢复；音乐原本关闭时不误启动。
- 移除录音启动后的点击提示音，避免向录音数据写入干扰声。

## 回归测试
- `tests/fairy/hold-to-talk.test.ts` 覆盖麦克风尚未启动完成时提前松手。
- `tests/speech/stt-options.test.ts` 覆盖中文热词和英文请求隔离。
- `tests/audio/bgm-interruption.test.ts` 覆盖播放中音乐的暂停恢复、原本暂停时不误启动，以及恢复函数幂等。

## 验证
- `node --experimental-strip-types --test tests/audio/bgm-interruption.test.ts tests/fairy/hold-to-talk.test.ts tests/speech/stt-options.test.ts tests/math/generation.test.ts tests/math/guide.test.ts tests/math/mistakes.test.ts tests/story/question-narration.test.ts tests/story/question-speech.test.ts`
- `npx tsc --noEmit`
- `npm run build`
- 未登录 `POST /api/speech/stt` 返回 `401`。
