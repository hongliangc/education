"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/**
 * 控件浮层的显隐与自动隐藏（参考腾讯）：播放中闲置 3 秒自动隐藏，暂停/缓冲时常驻；
 * 单击画面在显/隐之间切换。鼠标移动（onPointerMove）调用 showControls 重新计时。
 */
export function useControlsVisibility(
  videoRef: RefObject<HTMLVideoElement | null>,
  playing: boolean,
) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (video && !video.paused) setControlsVisible(false);
    }, 3000);
  }, [videoRef]);

  const hideControls = useCallback(() => {
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    setControlsVisible(false);
  }, []);

  const toggleControls = useCallback(() => {
    if (controlsVisible) hideControls();
    else showControls();
  }, [controlsVisible, hideControls, showControls]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    },
    [],
  );

  // 暂停 / 缓冲 → 控件常驻；播放 → 启动自动隐藏倒计时。
  useEffect(() => {
    if (playing) {
      showControls();
    } else {
      setControlsVisible(true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  return { controlsVisible, showControls, toggleControls };
}
