// Theater background themes. The cinema surface is intentionally dark (unlike the
// candy-coloured game modules). Backgrounds are concrete CSS values applied via an
// inline style — never Tailwind class strings — so they can't be purged from the
// production build and always render distinctly. Each carries an accent colour
// exposed as --theater-accent to lift labels off pure white.

export interface TheaterTheme {
  id: string;
  label: string;
  /** CSS background value for the page's fixed backdrop (inline style). */
  background: string;
  /** CSS colour for the switcher's preview dot (inline style). */
  swatch: string;
  /** Accent colour exposed as --theater-accent for eyebrows, counts, links. */
  accent: string;
}

// Bold, clearly-tinted backgrounds that stay coloured top-to-bottom (no fade to
// near-black) so switching themes visibly re-tints the whole page, not just a top
// glow the hero would hide. Applied to <main> via an inline style.
export const THEATER_THEMES: readonly TheaterTheme[] = [
  {
    id: "deepsea",
    label: "深海蓝",
    background: "linear-gradient(180deg, #12407f 0%, #0b2350 60%, #0a1c3f 100%)",
    swatch: "#1d4ed8",
    accent: "#7dd3fc",
  },
  {
    id: "midnight",
    label: "午夜黑",
    background: "linear-gradient(180deg, #1a1a1d 0%, #0c0c0e 100%)",
    swatch: "#0a0a0a",
    accent: "#fbbf24",
  },
  {
    id: "aurora",
    label: "极光紫",
    background: "linear-gradient(180deg, #42157e 0%, #260c49 60%, #1d0a39 100%)",
    swatch: "#7c3aed",
    accent: "#e879f9",
  },
  {
    id: "ember",
    label: "暖夜橙",
    background: "linear-gradient(180deg, #6b3110 0%, #3a1607 60%, #2c1206 100%)",
    swatch: "#ea580c",
    accent: "#fb923c",
  },
  {
    id: "forest",
    label: "森林绿",
    background: "linear-gradient(180deg, #11603a 0%, #0c3d27 60%, #0a2c1c 100%)",
    swatch: "#15803d",
    accent: "#6ee7b7",
  },
];

export const DEFAULT_THEATER_THEME = THEATER_THEMES[0];

export function themeById(id: string | null | undefined): TheaterTheme {
  return THEATER_THEMES.find((theme) => theme.id === id) ?? DEFAULT_THEATER_THEME;
}

const THEME_STORAGE_KEY = "mlk.video.theaterTheme";

/** Best-effort read of the saved theme id (null if unavailable). */
export function readTheaterThemeId(): string | null {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Best-effort persist of the chosen theme id; disabled storage is ignored. */
export function rememberTheaterThemeId(id: string): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    // ignore
  }
}
