# 故事字幕点击中断整段朗读

- id: `2026-06-06-story-subtitle-click-interrupts-speech`
- status: done
- commit: this commit

## 现象与复现
- 故事朗读期间，字幕中的文字仍然可以点击。
- 点击任意字幕文字后，当前整段故事语音被停止，播放状态被重置。

## 根因
- `SubtitleLine` 为每个非空白字符始终绑定 `onClick`。
- `StoryPlayer.speakChar` 点击后会停止当前 `speakChunks` 控制器并重置播放状态，导致整段朗读或暂停进度丢失。

## 修复
- 仅在播放器 `idle` 状态允许点字朗读。
- `playing` 和 `paused` 状态移除字幕点击处理与可点击样式。
- `speakChar` 增加状态守卫，避免陈旧事件意外中断整段朗读。
- 播放期间提示文案不再引导用户点击字幕。

## 回归测试
- 项目暂无 React 组件测试框架；通过 TypeScript 和生产构建验证 prop、状态守卫及 JSX 分支。
- 运行时验证步骤：开始整段朗读后点击字幕，朗读应继续；暂停后点击字幕，暂停进度应保留并可继续。

## 验证
- `npx tsc --noEmit`：通过。
- `bash scripts/docker-rebuild-web.sh`：Next.js 生产构建与 TypeScript 检查通过，web 容器健康。
- `GET http://localhost/api/health`：HTTP 200，数据库检查通过。
