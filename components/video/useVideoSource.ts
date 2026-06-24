"use client";

import { useEffect, useRef, useState } from "react";
import type { OpenListVariant } from "@/lib/openlist/client-core";
import { pickInitialQuality } from "@/lib/video/player-ui";
import { readRememberedQuality } from "@/lib/video/quality-storage";

/**
 * 解析当前播放源：在多清晰度 variants 间挑选 rendition（带记忆，避免 default→remembered 二次拉流），
 * 无 variants 时回退到裸 src。pendingResume / resumePlaying 记录切清晰度前的进度与播放态，
 * 交给 useVideoMediaState 续播。
 */
export function useVideoSource(variantList: OpenListVariant[], src: string | undefined) {
  const pendingResumeRef = useRef(0);
  const resumePlayingRef = useRef(false);
  const [activeQuality, setActiveQuality] = useState<string | undefined>(undefined);

  const activeSrc =
    variantList.length > 0 ? variantList.find((v) => v.quality === activeQuality)?.url : src;

  // 变更 variant 集合（新视频 / 刷新链接）时重选 rendition。
  useEffect(() => {
    if (variantList.length === 0) return;
    setActiveQuality((current) => {
      if (current && variantList.some((v) => v.quality === current)) return current;
      return pickInitialQuality(variantList, readRememberedQuality());
    });
  }, [variantList]);

  return { activeQuality, setActiveQuality, activeSrc, pendingResumeRef, resumePlayingRef };
}
