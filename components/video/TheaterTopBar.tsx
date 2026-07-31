"use client";

import Image from "next/image";
import { BackButton } from "@/components/BackButton";
import { RefreshIcon } from "@/components/video/icons";
import { cn } from "@/lib/utils";
import { THEATER_THEMES } from "@/lib/video/theater-theme";

interface TheaterTopBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Leave the world (only used when no category is open). */
  onBack: () => void;
  /** Title of the open category, or null when on the home browse surface. */
  activeCategoryTitle: string | null;
  /** Return from a category to the home browse surface. */
  onExitCategory: () => void;
  themeId: string;
  onThemeChange: (id: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Theater bar: context-aware back control, current category title, search box,
 * refresh and theme switcher. It stays in normal page flow so scrolling down
 * naturally moves it out of view.
 */
export function TheaterTopBar({
  query,
  onQueryChange,
  onBack,
  activeCategoryTitle,
  onExitCategory,
  themeId,
  onThemeChange,
  refreshing,
  onRefresh,
}: TheaterTopBarProps) {
  const inCategory = activeCategoryTitle !== null;

  return (
    <div className="mb-4 sm:mb-6">
      <div className="rounded-2xl bg-black/50 px-3 py-2.5 ring-1 ring-white/10 backdrop-blur-xl sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          {inCategory ? (
            <>
              <BackButton
                label="返回"
                onClick={onExitCategory}
                className="px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-lg"
              />
              <span className="min-w-0 flex-1 truncate text-base font-black text-white sm:text-lg">
                {activeCategoryTitle}
              </span>
            </>
          ) : (
            <>
              <BackButton
                label="返回世界"
                onClick={onBack}
                className="px-3 py-2 text-sm sm:px-5 sm:py-2.5 sm:text-lg"
              />
              <span className="flex min-w-0 items-center gap-2" aria-label="视频影院">
                <Image
                  src="/ui/locations/cinema.webp"
                  alt="视频影院"
                  width={48}
                  height={48}
                  loading="eager"
                  className="h-10 w-10 shrink-0 object-contain drop-shadow-lg sm:h-12 sm:w-12"
                />
                <span
                  aria-hidden="true"
                  style={{ backgroundImage: "linear-gradient(90deg,#ffffff,var(--theater-accent))" }}
                  className="truncate bg-clip-text text-lg font-black tracking-wide text-transparent drop-shadow sm:text-xl"
                >
                  视频影院
                </span>
              </span>
            </>
          )}

          <div className="ml-auto hidden items-center gap-1.5 sm:flex" role="group" aria-label="背景风格">
            {THEATER_THEMES.map((theme) => (
              <button
                key={theme.id}
                type="button"
                title={theme.label}
                aria-label={`背景：${theme.label}`}
                aria-pressed={themeId === theme.id}
                onClick={() => onThemeChange(theme.id)}
                style={{ background: theme.swatch }}
                className={cn(
                  "h-6 w-6 rounded-full transition hover:scale-110",
                  themeId === theme.id ? "scale-110 ring-2 ring-white" : "ring-1 ring-white/30",
                )}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="同步云盘视频"
            title="同步云盘视频"
            className={cn(
              "ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/85 ring-1 ring-white/15 transition hover:bg-white/15 hover:text-white disabled:cursor-wait disabled:opacity-60 sm:h-10 sm:w-10",
              refreshing && "animate-spin",
            )}
          >
            <RefreshIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="relative mt-2 w-full sm:order-none sm:ml-auto sm:mt-0 sm:w-56 md:w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索视频 / 拼音首字母"
            aria-label="搜索视频"
            className="h-10 w-full rounded-full bg-white/10 px-4 pl-10 text-sm text-white placeholder-white/40 ring-1 ring-white/20 backdrop-blur transition focus:outline-none focus:ring-white/40 sm:h-11 sm:pl-11 sm:text-lg"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--theater-accent)] sm:text-base">
            🔍
          </span>
        </div>
      </div>
    </div>
  );
}
