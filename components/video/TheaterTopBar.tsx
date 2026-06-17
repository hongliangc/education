"use client";

import { BackButton } from "@/components/BackButton";
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
}

/**
 * Sticky theater bar: back control, search box and theme switcher stay reachable no
 * matter how far the viewer has scrolled. The back control is context-aware — it
 * leaves the world from the home surface, or steps back one level out of a category
 * (whose title it then shows). Sits below the global HUD (top-16).
 */
export function TheaterTopBar({
  query,
  onQueryChange,
  onBack,
  activeCategoryTitle,
  onExitCategory,
  themeId,
  onThemeChange,
}: TheaterTopBarProps) {
  const inCategory = activeCategoryTitle !== null;

  return (
    <div className="sticky top-16 z-20 mb-6">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-black/45 px-3 py-3 ring-1 ring-white/10 backdrop-blur-xl">
        {inCategory ? (
          <>
            <BackButton label="返回" onClick={onExitCategory} />
            <span className="max-w-[45vw] truncate text-lg font-black text-white sm:max-w-none">
              {activeCategoryTitle}
            </span>
          </>
        ) : (
          <>
            <BackButton label="返回世界" onClick={onBack} />
            <span className="flex items-center gap-2" aria-label="视频影院">
              <span
                aria-hidden="true"
                style={{ background: "linear-gradient(135deg, var(--theater-accent), rgba(255,255,255,0.18))" }}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-xl shadow-lg ring-1 ring-white/30"
              >
                🎬
              </span>
              <span
                aria-hidden="true"
                style={{ backgroundImage: "linear-gradient(90deg,#ffffff,var(--theater-accent))" }}
                className="bg-clip-text text-xl font-black tracking-wide text-transparent drop-shadow"
              >
                视频影院
              </span>
            </span>
          </>
        )}

        <div className="relative order-last w-full sm:order-none sm:ml-auto sm:w-56 md:w-72">
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索视频…（拼音首字母，如 dhdy）"
            aria-label="搜索视频"
            className="h-11 w-full rounded-full bg-white/10 px-4 pl-11 text-base text-white placeholder-white/40 ring-1 ring-white/20 backdrop-blur transition focus:outline-none focus:ring-white/40 sm:text-lg"
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--theater-accent)]">
            🔍
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:ml-0" role="group" aria-label="背景风格">
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
      </div>
    </div>
  );
}
