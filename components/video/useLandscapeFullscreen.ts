"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

// Screen Orientation lock 仍是实验性 API，未进当前 TS DOM lib；按需声明（iPhone 上不存在）。
type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};
const orientationApi = (): LockableScreenOrientation | undefined =>
  typeof screen !== "undefined" ? (screen.orientation as LockableScreenOrientation) : undefined;

// iPhone 原生全屏：webkitEnterFullscreen 把 <video> 交给 iOS 系统播放器，未进 TS DOM lib。
type WebkitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitSupportsFullscreen?: boolean;
};

/**
 * 真全屏 + 默认横屏，分两条平台路径：
 *  - 桌面 / 安卓 / iPad（有元素 Fullscreen API）：请求容器全屏并锁横屏，自定义控件随容器一起全屏。
 *  - iPhone Safari（无元素全屏 API，地址栏/工具栏又去不掉）：调用原生 webkitEnterFullscreen
 *    交给 iOS 系统播放器拿真全屏，立刻铺满无栏；代价是全屏内只有原生控件，
 *    所以自定义的播放/选集等按钮只在非全屏（内联）时提供。
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

  // iPhone 原生播放器全屏：进出由 iOS 控制，镜像回 isFullscreen 让控件状态保持一致。
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
    // iPhone Safari 标签页：没有元素全屏 API，交给系统视频播放器拿真全屏。
    const video = videoRef.current as WebkitVideo | null;
    if (!video || typeof video.webkitEnterFullscreen !== "function") return;
    const enterNative = () => {
      try {
        video.webkitEnterFullscreen?.();
      } catch {
        // 原生全屏偶发不可用时静默忽略，留在内联自定义控件。
      }
    };
    // 元数据已就绪可直接进原生全屏。iOS 在首次播放前不加载元数据，
    // 此时 webkitSupportsFullscreen=false、webkitEnterFullscreen 静默无效，
    // 故在同一用户手势内开播以加载元数据，待 loadedmetadata 后再进全屏（避免“先点播放才能全屏”）。
    if (video.webkitSupportsFullscreen) {
      enterNative();
      return;
    }
    const onReady = () => {
      video.removeEventListener("loadedmetadata", onReady);
      enterNative();
    };
    video.addEventListener("loadedmetadata", onReady);
    void video.play().catch(() => undefined);
  }, [containerRef, videoRef]);

  const exit = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    orientationApi()?.unlock?.();
    setIsFullscreen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isFullscreen) exit();
    else enter();
  }, [isFullscreen, enter, exit]);

  return { isFullscreen, toggle };
}
