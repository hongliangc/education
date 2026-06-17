"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createNoReferrerHlsRequest } from "@/lib/video/hls-request";

/**
 * Attach an HLS source to a <video>, preferring native playback and falling back
 * to hls.js. Calls `onFatalError` once when the stream cannot recover, so the
 * caller can refresh the (short-lived) Alipan playlist URL. Resume / progress
 * tracking stays with the player so this hook only owns load + teardown.
 */
export function useHlsVideo(
  videoRef: RefObject<HTMLVideoElement | null>,
  src: string | undefined,
  onFatalError: () => void,
): void {
  const onFatalErrorRef = useRef(onFatalError);
  onFatalErrorRef.current = onFatalError;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    video.setAttribute("referrerpolicy", "no-referrer");

    let disposed = false;
    let destroy: (() => void) | undefined;
    let failed = false;
    const fail = () => {
      if (failed || disposed) return;
      failed = true;
      onFatalErrorRef.current();
    };
    video.addEventListener("error", fail);

    const teardown = () => {
      disposed = true;
      destroy?.();
      video.removeEventListener("error", fail);
      video.removeAttribute("src");
      video.load();
    };

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      return teardown;
    }

    void import("hls.js").then(({ default: Hls }) => {
      if (disposed) return;
      if (!Hls.isSupported()) {
        video.src = src;
        return;
      }
      const hls = new Hls({
        capLevelToPlayerSize: true,
        enableWorker: true,
        fetchSetup: (context, initParams) =>
          createNoReferrerHlsRequest(context.url, initParams as RequestInit),
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return;
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
          return;
        }
        fail();
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      destroy = () => hls.destroy();
    });

    return teardown;
  }, [src, videoRef]);
}
