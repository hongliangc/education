# 视频影院下一集与返回兑换异常

- id: `2026-07-19-theater-next-episode`
- status: done
- commit: this commit

## 现象与复现
- 视频影院点击“下一集”后，下一集无法播放。
- 从播放页返回上一层时，弹出需要“小星星”兑换的提示。
- 进入视频影院播放一集，点击“下一集”；再返回上一层观察兑换提示。

## 根因
- 下一集未解锁时，统一入口 `openVideo` 设置了兑换弹窗，但没有停止当前播放器。
- 播放器通过 portal 挂在 `document.body` 且层级为 `z-50`，兑换弹窗位于页面树内且为 `z-40`，因此弹窗已打开却被播放器完全遮住；返回关闭播放器后才显现。

## 修复
- 进入未解锁视频的兑换流程前先停止当前播放，使兑换提示立即显示；直接从片库打开未解锁视频时该操作为空操作。

## 回归测试
- 检查未解锁分支必须先调用 `stopPlayback()`，再设置 `pendingUnlock`。

## 验证
- `node --test tests/video/*.test.ts`：13/13 通过。
- `npx tsc --noEmit`：通过。
- `git diff --check`：通过。
- `graphify update .`：更新完成（2952 nodes，6039 edges）。
