# 故事答题页未自动播报

- id: `2026-06-06-story-question-autoplay`
- status: done
- commit: this commit

## 现象与复现
- 故事播放结束后，点击“读完了，回答问题 →”进入作答界面，没有自动播报题目和选项。
- 复现步骤：进入故事阅读页，点击“读完了，回答问题 →”，观察答题页是否立即发声。

## 根因
- `StoryQuestion` 在挂载后的 `useEffect` 中调用 `speakText`，此时“读完了，回答问题”按钮的点击事件已经结束。
- `speakText` 先异步请求云 TTS，再调用 `HTMLAudioElement.play()`；移动端浏览器要求有声媒体播放由用户手势直接触发，因此该调用会被自动播放策略拒绝。
- 云音频失败后的 Web Speech 回退还会异步等待音色加载，也无法保证在原始点击手势内调用 `speechSynthesis.speak()`。
- 用户实际访问的 `http://localhost` 由 Docker nginx 转发到 `education-web` 生产容器；该容器在修复前已运行约 51 分钟，仍使用旧 bundle。工作区代码和 `localhost:3000` 开发服务的变化不会自动更新生产容器。

## 修复
- “读完了，回答问题”点击时播报第一题；“下一题”点击时播报下一题。
- 题目、选项和答题解析统一调用故事正文现有的 `speakChunks`，复用腾讯流式 TTS、缓存、用户音色、暂停/停止和失败降级策略。
- 删除独立的 `speakTextImmediately` Web Speech 方案，避免维护两套答题语音路径。
- `StoryPlayer` 卸载时只停止自身持有的语音控制器，避免取消刚启动的问题播报；单字点读也统一保存控制器。
- 使用 `scripts/docker-rebuild-web.sh` 重建并替换 `education-web`，把修复部署到用户实际验证的 `http://localhost`。

## 回归测试
- `tests/story/question-narration.test.ts`：验证题目播报使用统一的分段腾讯 TTS 策略和中文语速参数。
- `tests/story/question-speech.test.ts`：验证问题与 A/B/C 选项按顺序组成播报文本。

## 验证
- `node --test tests/story/question-narration.test.ts tests/story/question-speech.test.ts`
- `npx tsc --noEmit`
- `git diff --check`
- Docker 镜像构建成功，`education-web` 重建后健康检查为 `healthy`。
