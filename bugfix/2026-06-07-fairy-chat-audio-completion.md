# 小精灵长回复播放与录音收尾

- id: `2026-06-07-fairy-chat-audio-completion`
- status: done
- commit: this commit

## 现象与复现
- 小精灵回复较长时，语音播放会在文本结束前停止，剩余内容不会继续播放。
- 按住说话后快速松开，录音可能漏掉最后几个字。

## 根因
- 精灵聊天对回复长度不做区分，始终调用单段 `speakTextStream`；长回复没有复用项目已有的分段续播能力。
- 松手事件直接调用录音器 `stop()`，音频处理链没有尾部缓冲时间，快速松手时最后一小段语音可能尚未进入采样缓冲。

## 修复
- 精灵自动朗读和重听统一改用 `speakChunks`，按句分段并逐段续播。
- 松手后保留 200ms 录音缓冲，再停止录音并提交识别。

## 回归测试
- 精灵聊天回复调用 `speakChunks`，避免长回答只播放单段。
- 松手后等待 200ms 才停止录音。
- 释放延迟期间取消会停止并丢弃录音，不会继续提交识别。

## 验证
- `npx tsc --noEmit`
- `node --experimental-strip-types --test`：除既有 `tests/speech/chunking.test.ts` 的 Node 24 无扩展名 ESM 导入问题外，其余测试通过。
