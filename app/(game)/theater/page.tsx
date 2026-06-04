"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Btn } from "@/components/Btn";
import { GameModal } from "@/components/GameModal";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useSFX } from "@/components/audio/useSFX";
import { useGameStore } from "@/store/gameStore";

interface VideoItem {
  id: string;
  title: string;
  posterUrl?: string;
  durationSec?: number;
  resolution?: string;
  ageBand?: string;
  subject?: string;
  summary?: string;
  order: number;
  cost: number;
  unlocked: boolean;
}

interface PlayInfo {
  url: string;
  quality?: string;
}

function formatDuration(seconds: number | undefined): string {
  if (!seconds) return "短片";
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest}秒`;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export default function TheaterPage() {
  const router = useRouter();
  const child = useGameStore((state) => state.activeChild);
  const setStars = useGameStore((state) => state.setStars);
  const { sfx } = useSFX();
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [pendingUnlock, setPendingUnlock] = useState<VideoItem | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [playInfo, setPlayInfo] = useState<PlayInfo | null>(null);
  const [playLoading, setPlayLoading] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
    }
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    const activeChild = child;
    let cancelled = false;

    async function loadVideos() {
      setLoading(true);
      setCatalogError(null);
      try {
        const res = await fetch(`/api/videos?childId=${encodeURIComponent(activeChild.id)}`);
        if (!res.ok) throw new Error("catalog_failed");
        const json = (await res.json()) as { videos?: VideoItem[] };
        if (!cancelled) setVideos(json.videos ?? []);
      } catch {
        if (!cancelled) setCatalogError("视频暂时看不了，等一下再试试。");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadVideos();
    return () => {
      cancelled = true;
    };
  }, [child]);

  const sortedVideos = useMemo(
    () => videos.toSorted((a, b) => a.order - b.order || a.title.localeCompare(b.title, "zh-CN")),
    [videos],
  );

  const startPlayback = async (video: VideoItem) => {
    if (!child) return;
    const activeChild = child;
    setActiveVideo(video);
    setPlayInfo(null);
    setPlayError(null);
    setPlayLoading(true);

    try {
      const res = await fetch(
        `/api/videos/${encodeURIComponent(video.id)}/play?childId=${encodeURIComponent(activeChild.id)}`,
      );
      if (res.status === 403) throw new Error("locked");
      if (!res.ok) throw new Error("play_failed");
      const json = (await res.json()) as { play?: PlayInfo };
      if (!json.play?.url) throw new Error("play_missing");
      setPlayInfo(json.play);
    } catch (error) {
      setPlayError(
        error instanceof Error && error.message === "locked"
          ? "先用小星星解锁吧。"
          : "这个视频暂时打不开。",
      );
    } finally {
      setPlayLoading(false);
    }
  };

  const openVideo = (video: VideoItem) => {
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
          <button
            type="button"
            onClick={() => router.push("/world")}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-2xl font-black text-slate-700 shadow ring-1 ring-white"
            aria-label="返回世界地图"
          >
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black text-white drop-shadow sm:text-4xl">
              🎬 视频影院
            </h1>
            <p className="mt-1 text-sm font-bold text-white/90 drop-shadow">
              {child.name}，挑一个动画片或知识科普视频吧
            </p>
          </div>
        </header>

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="aspect-[3/4] animate-pulse rounded-3xl bg-white/55 shadow ring-1 ring-white/60"
              />
            ))}
          </div>
        )}

        {!loading && catalogError && (
          <div className="rounded-3xl bg-white/90 p-6 text-center shadow-xl ring-1 ring-white">
            <div className="mb-2 text-5xl">☁️</div>
            <p className="mb-4 text-lg font-bold text-slate-700">{catalogError}</p>
            <Btn variant="secondary" onClick={() => window.location.reload()}>
              再试一次
            </Btn>
          </div>
        )}

        {!loading && !catalogError && sortedVideos.length === 0 && (
          <div className="rounded-3xl bg-white/90 p-6 text-center shadow-xl ring-1 ring-white">
            <div className="mb-2 text-5xl">📁</div>
            <p className="text-lg font-bold text-slate-700">视频库还是空的。</p>
          </div>
        )}

        {!loading && !catalogError && sortedVideos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sortedVideos.map((video) => (
              <button
                key={video.id}
                type="button"
                onClick={() => openVideo(video)}
                className="group overflow-hidden rounded-3xl bg-white/90 text-left shadow-xl ring-1 ring-white transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className="relative aspect-[3/4] bg-gradient-to-br from-sky-200 via-emerald-100 to-amber-100">
                  {video.posterUrl ? (
                    <img
                      src={video.posterUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-6xl">🎞️</div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <span className="rounded-full bg-white/90 px-2 py-1 text-xs font-black text-slate-700">
                      {formatDuration(video.durationSec)}
                    </span>
                    {(video.subject || video.ageBand) && (
                      <span className="rounded-full bg-emerald-300 px-2 py-1 text-xs font-black text-emerald-950">
                        {video.subject ?? video.ageBand}
                      </span>
                    )}
                  </div>
                  {!video.unlocked && (
                    <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-slate-950/75 px-3 py-1 text-sm font-black text-white shadow">
                      <span aria-hidden="true">🔒</span>
                      <span>⭐×{video.cost}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h2 className="line-clamp-2 min-h-10 text-base font-black text-slate-700">
                    {video.title}
                  </h2>
                  {video.summary ? (
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-500">
                      {video.summary}
                    </p>
                  ) : video.resolution ? (
                    <p className="mt-1 text-xs font-bold text-slate-400">{video.resolution}</p>
                  ) : null}
                  {video.subject && video.ageBand && (
                    <p className="mt-2 inline-flex rounded-full bg-sky-100 px-2 py-1 text-xs font-black text-sky-700">
                      {video.ageBand}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeVideo && (
        <VideoPlayer
          title={activeVideo.title}
          posterUrl={activeVideo.posterUrl}
          src={playInfo?.url}
          loading={playLoading}
          error={playError ?? undefined}
          onBack={() => {
            setActiveVideo(null);
            setPlayInfo(null);
            setPlayError(null);
            setPlayLoading(false);
          }}
        />
      )}

      {pendingUnlock && (
        <GameModal
          title="解锁动画片"
          emoji="⭐"
          color="#f59e0b"
          onClose={() => {
            if (!unlockLoading) {
              setPendingUnlock(null);
              setUnlockError(null);
            }
          }}
        >
          <div className="space-y-5 text-center">
            <div>
              <p className="text-lg font-black text-slate-700">
                用 {pendingUnlock.cost}⭐ 解锁《{pendingUnlock.title}》吗？
              </p>
              <p className="mt-2 text-sm font-bold text-slate-500">
                你现在有 {child.totalStars}⭐，解锁后可以一直重看。
              </p>
            </div>
            {unlockError && (
              <div className="rounded-2xl bg-amber-100 px-4 py-3 text-sm font-black text-amber-800">
                {unlockError}
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Btn
                variant="ghost"
                disabled={unlockLoading}
                onClick={() => {
                  setPendingUnlock(null);
                  setUnlockError(null);
                }}
              >
                返回
              </Btn>
              <Btn disabled={unlockLoading} onClick={() => void confirmUnlock()}>
                {unlockLoading ? "解锁中..." : "确认解锁"}
              </Btn>
            </div>
          </div>
        </GameModal>
      )}
    </main>
  );
}
