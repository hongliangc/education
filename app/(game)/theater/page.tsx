"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { TheaterVideoItem } from "@/components/video/TheaterCatalog";
import { TheaterBrowse } from "@/components/video/TheaterBrowse";
import { TheaterTopBar } from "@/components/video/TheaterTopBar";
import { BackToTop } from "@/components/video/BackToTop";
import { TheaterUnlockModal } from "@/components/video/TheaterUnlockModal";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { useTheaterCatalog } from "@/components/video/useTheaterCatalog";
import { useTheaterPlayback } from "@/components/video/useTheaterPlayback";
import { useSFX } from "@/components/audio/useSFX";
import { useGameStore } from "@/store/gameStore";
import { readResumePosition, rememberResumePosition } from "@/lib/video/resume-storage";
import {
  DEFAULT_THEATER_THEME,
  readTheaterThemeId,
  rememberTheaterThemeId,
  themeById,
} from "@/lib/video/theater-theme";

export default function TheaterPage() {
  const router = useRouter();
  const child = useGameStore((state) => state.activeChild);
  const setStars = useGameStore((state) => state.setStars);
  const { sfx } = useSFX();
  const {
    categories,
    setVideos,
    loading,
    refreshing,
    error: catalogError,
    refreshCatalog,
  } = useTheaterCatalog(child?.id);
  const {
    activeVideo,
    playInfo,
    playLoading,
    playError,
    resumeAtSec,
    startPlayback,
    refreshSource,
    stopPlayback,
  } = useTheaterPlayback(child?.id);
  const [pendingUnlock, setPendingUnlock] = useState<TheaterVideoItem | null>(null);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [themeId, setThemeId] = useState(DEFAULT_THEATER_THEME.id);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const saved = readTheaterThemeId();
    if (saved) setThemeId(saved);
  }, []);

  const changeTheme = useCallback((id: string) => {
    setThemeId(id);
    rememberTheaterThemeId(id);
  }, []);

  // Drilling into / out of a category starts the new surface at the top.
  const changeCategory = useCallback((key: string | null) => {
    setActiveCategory(key);
    window.scrollTo({ top: 0 });
  }, []);

  useEffect(() => {
    if (!child) {
      router.replace("/child-select");
    }
  }, [child, router]);

  const openVideo = (video: TheaterVideoItem) => {
    sfx.click();
    setUnlockError(null);
    if (!video.unlocked) {
      setPendingUnlock(video);
      return;
    }
    void startPlayback(video, readResumePosition(video.id));
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
      void startPlayback(unlockedVideo, readResumePosition(unlockedVideo.id));
    } catch {
      setUnlockError("解锁失败了，再试一次。");
    } finally {
      setUnlockLoading(false);
    }
  };

  if (!child) return null;

  const theme = themeById(themeId);
  // Background lives on <main>'s own box (not a -z-10 layer) so nothing can paint
  // over it; the accent var rides along for themed labels.
  const mainStyle = {
    "--theater-accent": theme.accent,
    background: theme.background,
  } as CSSProperties;
  const activeCategoryTitle = activeCategory
    ? categories.find((c) => c.key === activeCategory)?.title ?? null
    : null;

  // Episodes = the playing video's collection siblings (already episode-sorted in the catalog),
  // powering 下一集 / 选集 for multi-video folders. openVideo keeps the star-unlock gating.
  const episodeSiblings = activeVideo
    ? categories.find((c) => c.key === activeVideo.category)?.videos ?? []
    : [];
  const currentEpisodeIndex = activeVideo
    ? episodeSiblings.findIndex((video) => video.id === activeVideo.id)
    : -1;
  const nextEpisode =
    currentEpisodeIndex >= 0 ? episodeSiblings[currentEpisodeIndex + 1] : undefined;

  return (
    <main
      className="relative min-h-screen px-3 pb-10 pt-14 sm:px-4 sm:pb-12 sm:pt-16"
      style={mainStyle}
    >
      <div className="mx-auto max-w-6xl">
        <TheaterTopBar
          query={query}
          onQueryChange={setQuery}
          onBack={() => router.push("/world")}
          activeCategoryTitle={activeCategoryTitle}
          onExitCategory={() => changeCategory(null)}
          themeId={themeId}
          onThemeChange={changeTheme}
          refreshing={refreshing}
          onRefresh={() => void refreshCatalog()}
        />
        <TheaterBrowse
          categories={categories}
          loading={loading}
          error={catalogError}
          query={query}
          activeCategory={activeCategory}
          onActiveCategoryChange={changeCategory}
          onOpen={openVideo}
        />
      </div>
      <BackToTop />

      {activeVideo && (
        <VideoPlayer
          title={activeVideo.title}
          posterUrl={activeVideo.posterUrl}
          src={playInfo?.url}
          variants={playInfo?.variants}
          loading={playLoading}
          error={playError ?? undefined}
          resumeAtSec={resumeAtSec}
          episodes={episodeSiblings.map((video) => ({ id: video.id, title: video.title }))}
          currentEpisodeId={activeVideo.id}
          onRefreshSource={refreshSource}
          onRememberPosition={(currentTimeSec, durationSec) =>
            rememberResumePosition(activeVideo.id, currentTimeSec, undefined, durationSec)
          }
          onBack={(currentTimeSec = 0, durationSec = 0) => {
            rememberResumePosition(activeVideo.id, currentTimeSec, undefined, durationSec);
            stopPlayback();
          }}
          onNext={
            nextEpisode
              ? () => openVideo(nextEpisode)
              : undefined
          }
          onSelectEpisode={(id) => {
            const target = episodeSiblings.find((video) => video.id === id);
            if (target) openVideo(target);
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
