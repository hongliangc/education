"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  title: string;
  posterUrl?: string;
  src?: string;
  loading?: boolean;
  error?: string;
  onBack: () => void;
}

export function VideoPlayer({
  title,
  posterUrl,
  src,
  loading = false,
  error,
  onBack,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let disposed = false;
    let destroy: (() => void) | undefined;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return;
    }

    void import("hls.js").then(({ default: Hls }) => {
      if (disposed || !Hls.isSupported()) {
        video.src = src;
        return;
      }
      const hls = new Hls({
        capLevelToPlayerSize: true,
        enableWorker: true,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      destroy = () => hls.destroy();
    });

    return () => {
      disposed = true;
      destroy?.();
      video.removeAttribute("src");
      video.load();
    };
  }, [src]);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || !src) return;
    if (video.paused) {
      await video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const seekBy = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime + seconds);
  };

  return (
    <section className="fixed inset-0 z-50 bg-slate-950 text-white">
      <video
        ref={videoRef}
        className="h-full w-full bg-black object-contain"
        poster={posterUrl}
        playsInline
        controls={false}
        muted={muted}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent px-4 py-4 sm:px-6">
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-2xl font-bold backdrop-blur transition hover:bg-white/30"
            aria-label="返回片库"
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold sm:text-2xl">{title}</h1>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-5 pt-20 sm:px-6">
        <div className="pointer-events-auto mx-auto flex max-w-3xl items-center justify-center gap-3 rounded-3xl bg-black/40 p-3 backdrop-blur">
          <button
            type="button"
            onClick={() => seekBy(-10)}
            className="h-12 w-12 rounded-full bg-white/20 text-lg font-black transition hover:bg-white/30"
            aria-label="后退十秒"
          >
            -10
          </button>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!src || loading}
            className={cn(
              "h-16 w-16 rounded-full bg-white text-3xl font-black text-slate-900 shadow-xl transition",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            aria-label={playing ? "暂停" : "播放"}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <button
            type="button"
            onClick={() => seekBy(10)}
            className="h-12 w-12 rounded-full bg-white/20 text-lg font-black transition hover:bg-white/30"
            aria-label="前进十秒"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => setMuted((value) => !value)}
            className="h-12 w-12 rounded-full bg-white/20 text-lg font-black transition hover:bg-white/30"
            aria-label={muted ? "打开声音" : "静音"}
          >
            {muted ? "×" : "♪"}
          </button>
        </div>
      </div>

      {(loading || error || !src) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/55 px-6">
          <div className="max-w-sm rounded-3xl bg-white p-5 text-center text-slate-700 shadow-2xl">
            <div className="mb-3 text-5xl">{error ? "☁️" : "🎬"}</div>
            <p className="mb-4 text-lg font-bold">
              {error ?? (loading ? "视频正在准备..." : "选一个视频开始播放")}
            </p>
            {error && (
              <Btn variant="secondary" onClick={onBack}>
                返回片库
              </Btn>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
