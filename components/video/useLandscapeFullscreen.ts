"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

// Screen Orientation lock 仍是实验性 API，未进当前 TS DOM lib；按需声明（iPhone 上不存在）。
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};
const orientationApi = (): LockableScreenOrientation | undefined =>
  typeof screen !== "undefined" ? (screen.orientation as LockableScreenOrientation) : undefined;

// iPhone Safari 只在 <video> 上提供原生全屏（webkitEnterFullscreen），不在 TS DOM lib 里，按需声明。
type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

/**
 * 真全屏 + 默认横屏，像腾讯视频网页/App 那样：
 *  - 桌面 / 安卓 / iPad（有 Fullscreen API）：请求元素全屏并锁定横屏，自定义控件随容器一起全屏。
 *  - iPhone Safari（无元素全屏 API）：调用 `<video>.webkitEnterFullscreen()` 进入 iOS 原生播放器，
 *    系统自动横屏铺满、自带控件——这是 iPhone 网页唯一能做到的“真全屏”。
 *
 * iPhone 原生全屏由系统的“完成”按钮退出，并通过 video 的 webkit{begin,end}fullscreen 事件回写状态。
 */
export function useLandscapeFullscreen(
  containerRef: RefObject<HTMLElement | null>,
  videoRef: RefObject<HTMLVideoElement | null>,
) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 桌面/安卓/iPad：原生全屏可被系统手势 / Esc 退出，镜像回状态并解除方向锁。
  useEffect(() => {
    const onFs = () => {
      const active = Boolean(document.fullscreenElement);
      if (!active) orientationApi()?.unlock?.();
      setIsFullscreen(active);
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // iPhone：原生 <video> 全屏在 video 元素上触发 webkit{begin,end}fullscreen。
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onBegin = () => setIsFullscreen(true);
    const onEnd = () => setIsFullscreen(false);
    video.addEventListener("webkitbeginfullscreen", onBegin);
    video.addEventListener("webkitendfullscreen", onEnd);
    return () => {
      video.removeEventListener("webkitbeginfullscreen", onBegin);
      video.removeEventListener("webkitendfullscreen", onEnd);
    };
  }, [videoRef]);

  const enter = useCallback(() => {
    const el = containerRef.current;
    // 桌面 / 安卓 / iPad：元素全屏 + 锁横屏（自定义控件随容器全屏）。
    if (el && typeof el.requestFullscreen === "function" && document.fullscreenEnabled) {
      void el
        .requestFullscreen()
        .then(() => orientationApi()?.lock?.("landscape"))
        .catch(() => undefined);
      return;
    }
    // iPhone Safari：退化为 <video> 原生全屏（真全屏 + 自动横屏）。
    const video = videoRef.current as WebkitVideo | null;
    video?.webkitEnterFullscreen?.();
  }, [containerRef, videoRef]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    orientationApi()?.unlock?.();
    // iPhone 原生全屏由系统“完成”按钮退出，无需额外处理。
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle };
}
