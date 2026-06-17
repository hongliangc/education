export interface SearchableVideo {
  title: string;
  categoryTitle: string;
  subject?: string;
  /** Precomputed pinyin (full + initials), lowercased, for Chinese-friendly matching. */
  searchKey?: string;
}

export interface FeaturedCandidate {
  posterUrl?: string;
  unlocked?: boolean;
}

/**
 * Case-insensitive substring filter over title / category / subject / pinyin key.
 * Empty query returns a copy of the full list, preserving order.
 */
export function filterVideos<T extends SearchableVideo>(
  videos: readonly T[],
  query: string,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...videos];
  return videos.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      v.categoryTitle.toLowerCase().includes(q) ||
      (v.subject?.toLowerCase().includes(q) ?? false) ||
      (v.searchKey?.includes(q) ?? false),
  );
}

/** Deterministic Hero pick: prefer an unlocked video with a poster, then any with a poster. */
export function pickFeatured<T extends FeaturedCandidate>(videos: readonly T[]): T | undefined {
  return (
    videos.find((v) => v.unlocked && v.posterUrl) ??
    videos.find((v) => v.posterUrl) ??
    videos[0]
  );
}
