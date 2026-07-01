// 历史板块背景歌曲开关（右上角，HUD 下方）。默认播放，点击开/关并持久化。
"use client";
import { useHistoryBgm } from "@/components/audio/historyBgm";

const GOLD = "#C9A24B";

export function HistoryBgm() {
  const { enabled, toggle } = useHistoryBgm();
  return (
    <button
      onClick={toggle}
      aria-label={enabled ? "关闭背景歌曲" : "开启背景歌曲"}
      aria-pressed={enabled}
      title={enabled ? "背景歌曲：开" : "背景歌曲：关"}
      className="fixed right-3 top-[calc(env(safe-area-inset-top)_+_4.25rem)] z-30 flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur transition hover:scale-105 active:translate-y-0.5"
      style={{
        background: enabled ? "rgba(244,223,170,.95)" : "rgba(255,255,255,.85)",
        border: `2px solid ${GOLD}`,
        boxShadow: enabled
          ? `0 4px 12px rgba(0,0,0,.3), 0 0 14px ${GOLD}66`
          : "0 4px 12px rgba(0,0,0,.25)",
      }}
    >
      <span className="text-xl leading-none" aria-hidden>
        {enabled ? "🎵" : "🔇"}
      </span>
    </button>
  );
}
