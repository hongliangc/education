// Pure helpers (no DOM / node deps) so both the server catalog and the client
// grouping can sort a collection's episodes in natural ascending order, and so
// the parsing can be unit-tested directly.

/**
 * Pull a sortable sequence number out of a (already-cleaned) video title.
 * Handles SxxExx (season-major), 第N集/话/期/回, EPxx, and a leading "81." number.
 * Returns null when the title carries no episode/sequence marker (e.g. a movie).
 */
export function episodeNumber(title: string): number | null {
  const se = title.match(/S(\d{1,2})E(\d{1,3})/i);
  if (se) return Number(se[1]) * 1000 + Number(se[2]);

  const cn = title.match(/第\s*0*(\d{1,4})\s*[集話话期回]/);
  if (cn) return Number(cn[1]);

  const ep = title.match(/\bEP?\s*0*(\d{1,3})\b/i);
  if (ep) return Number(ep[1]);

  const lead = title.match(/^\s*0*(\d{1,4})\s*[.,、_\-]/);
  if (lead) return Number(lead[1]);

  return null;
}

/**
 * Order two titles so numbered episodes ascend (1 → 2 → 10), numbered items come
 * before un-numbered ones, and ties fall back to a stable zh-CN collation.
 */
export function compareEpisodes(aTitle: string, bTitle: string): number {
  const a = episodeNumber(aTitle);
  const b = episodeNumber(bTitle);
  if (a !== null && b !== null) {
    if (a !== b) return a - b;
  } else if (a !== null) {
    return -1;
  } else if (b !== null) {
    return 1;
  }
  return aTitle.localeCompare(bTitle, "zh-CN");
}
