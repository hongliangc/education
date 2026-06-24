"use client";

import { useEffect, useState } from "react";

/**
 * 触屏优先设备（手机 / 平板）返回 true。用它而不是 Tailwind 的 `sm:` 宽度断点来切换
 * 播放器控件密度：iPhone 横屏宽度也 > 640px，按宽度判断会误显桌面全量按钮，破坏沉浸式
 * 观感。`(pointer: coarse)` 跟随的是输入方式，横竖屏都稳定。
 *
 * SSR 期间无 matchMedia，默认 false（桌面全量），挂载后再校正；首帧多出的按钮通常被
 * 加载遮罩盖住，影响可忽略。
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(pointer: coarse)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return coarse;
}
