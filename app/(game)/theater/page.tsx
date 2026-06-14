"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import {
  TheaterCatalog,
  type TheaterVideoItem,
} from "@/components/video/TheaterCatalog";
import { TheaterUnlockModal } from "@/components/video/TheaterUnlockModal";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useTheaterCatalog } from "@/components/video/useTheaterCatalog";
import { useSFX } from "@/components/audio/useSFX";
import { useGameStore } from "@/store/gameStore";
import { playRetryDelayMs } from "@/lib/video/playback";

interface PlayInfo {
  url: string;
  quality?: string;
}

export default function TheaterPage() {
  const router = useRouter();
  const child = useGameStore((state) => state.activeChild);
  const setStars = useGameStore((state) => state.setStars);
  const { sfx } = useSFX();
  const {
    sortedVideos,
    setVideos,
    loading,
    error: catalogError,
  } = useTheaterCatalog(child?.id);
  const [activeVideo, setActiveVideo] = useState<TheaterVideoItem | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<TheaterVideoItem | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [playInfo, setPlayInfo] = useState<PlayInfo | null>(null);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [resumeAtSec, setResumeAtSec] = useState(0);
  const playAbortRef = useRef<AbortController | null>(null);
  const sourceRefreshCountRef = useRef(0);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
    }
  }, [child, router]);

  useEffect(
    () => () => {
      playAbortRef.current?.abort();
    },
    [],
  );

  const startPlayback = useCallback(async (
    video: TheaterVideoItem,
    resumeAt = 0,
    refreshSource = false,
  ) => {
    if (!child) return;
    const activeChild = child;
    playAbortRef.current?.abort();
    const controller = new AbortController();
    playAbortRef.current = controller;
    if (!refreshSource) sourceRefreshCountRef.current = 0;
    setActiveVideo(video);
    setPlayInfo(null);
    setResumeAtSec(resumeAt);
    setPlayError(null);
    setPlayLoading(true);

    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        const res = await fetch(
          `/api/videos/${encodeURIComponent(video.id)}/play?childId=${encodeURIComponent(activeChild.id)}${refreshSource ? "&refresh=1" : ""}`,
          { signal: controller.signal },
        );
        if (res.status === 403) throw new Error("locked");
        const json = (await res.json().catch(() => ({}))) as {
          play?: PlayInfo;
          error?: string;
          retryAfterSec?: number;
        };
        if (res.status === 202 && json.error === "video_preparing") {
          await new Promise<void>((resolve, reject) => {
            const timeout = window.setTimeout(resolve, playRetryDelayMs(attempt, json.retryAfterSec));
            controller.signal.addEventListener(
              "abort",
              () => {
                window.clearTimeout(timeout);
                reject(new DOMException("Aborted", "AbortError"));
              },
              { once: true },
            );
          });
          continue;
        }
        if (!res.ok) throw new Error("play_failed");
        if (!json.play?.url) throw new Error("play_missing");
        setPlayInfo(json.play);
        return;
      }
      throw new Error("video_preparing");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setPlayError(
        error instanceof Error && error.message === "locked"
          ? "先用小星星解锁吧。"
          : error instanceof Error && error.message === "video_preparing"
            ? "视频还在准备中，稍后再试。"
          : "这个视频暂时打不开。",
      );
    } finally {
      if (playAbortRef.current === controller) {
        setPlayLoading(false);
      }
    }
  }, [child]);

  const openVideo = (video: TheaterVideoItem) => {
    sfx.click();
    setUnlockError(null);
    if (!video.unlocked) {
      setPendingUnlock(video);
      return;
    }
    void startPlayback(video);
  };

  const confirmUnlock = async () => {
    if (!pendingUnlock || !child) return;
    const activeChild = child;
    setUnlockLoading(true);
    setUnlockError(null);

    try {
      const res = await fetch(`/api/videos/${encodeURIComponent(pendingUnlock.id)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId: activeChild.id }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        balance?: number;
        needed?: number;
      };

      if (res.status === 402) {
        setUnlockError(`还差 ${json.needed ?? pendingUnlock.cost} 颗星，去闯关赚一赚吧！`);
        return;
      }
      if (!res.ok || typeof json.balance !== "number") {
        throw new Error("unlock_failed");
      }

      setStars(json.balance);
      const unlockedVideo = { ...pendingUnlock, unlocked: true };
      setVideos((items) =>
        items.map((item) => (item.id === pendingUnlock.id ? unlockedVideo : item)),
      );
      setPendingUnlock(null);
      sfx.coin();
      void startPlayback(unlockedVideo);
    } catch {
      setUnlockError("解锁失败了，再试一次。");
    } finally {
      setUnlockLoading(false);
    }
  };

  if (!child) return null;

  return (
    <main className="min-h-screen px-4 pb-12 pt-20">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-wrap items-center gap-3">
          <BackButton label="返回世界" onClick={() => router.push("/world")} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black text-white drop-shadow sm:text-4xl">
              🎬 视频影院
            </h1>
            <p className="mt-1 text-sm font-bold text-white/90 drop-shadow">
              {child.name}，挑一个动画片或知识科普视频吧
            </p>
          </div>
        </header>

        <TheaterCatalog
          videos={sortedVideos}
          loading={loading}
          error={catalogError}
          onOpen={openVideo}
        />
      </div>

      {activeVideo && (
        <VideoPlayer
          title={activeVideo.title}
          posterUrl={activeVideo.posterUrl}
          src={playInfo?.url}
          loading={playLoading}
          error={playError ?? undefined}
          resumeAtSec={resumeAtSec}
          onRefreshSource={(currentTime) => {
            if (sourceRefreshCountRef.current >= 2) {
              setPlayInfo(null);
              setPlayLoading(false);
              setPlayError("视频连接不稳定，稍后再试。");
              return;
            }
            sourceRefreshCountRef.current++;
            void startPlayback(activeVideo, currentTime, true);
          }}
          onBack={() => {
            playAbortRef.current?.abort();
            setActiveVideo(null);
            setPlayInfo(null);
            setPlayError(null);
            setPlayLoading(false);
            setResumeAtSec(0);
          }}
        />
      )}

      {pendingUnlock && (
        <TheaterUnlockModal
          video={pendingUnlock}
          balance={child.totalStars}
          loading={unlockLoading}
          error={unlockError}
          onCancel={() => {
            setPendingUnlock(null);
            setUnlockError(null);
          }}
          onConfirm={() => void confirmUnlock()}
        />
      )}
    </main>
  );
}
