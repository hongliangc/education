// Pure, closed-set judge for the "say it aloud" steps (design §4). Self-contained leaf: it carries
// no runtime value imports, so the Node test runner can load it directly via its `.ts` path. The
// child's ASR transcript is matched ONLY against this lesson's words — a closed set that makes the
// encourage-first UX forgiving and sidesteps open-vocabulary ASR errors for 3–10-year-olds.

export interface SpokenCandidate {
  id: string;
  en: string;
}

export interface MatchResult {
  matched: boolean;
  bestId: string | null;
}

// Lowercase, drop punctuation/digits, collapse whitespace — so "Apple!" and "  banana  " compare cleanly.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Levenshtein edit distance over short strings (iterative two-row).
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur: number[] = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = cur;
  }
  return prev[b.length];
}

// Short words tolerate one slipped sound; longer words tolerate two.
function tolerance(word: string): number {
  return word.length <= 4 ? 1 : 2;
}

// Decide whether what the child said counts, and which lesson word it was. Priority: a whole lesson
// word embedded in the utterance (handles phrases like "I want apples, please" and plurals) wins;
// otherwise the nearest word by edit distance counts if it's within tolerance. Empty speech never
// matches (the UI then offers a gentle retry or the self-confirm fallback).
export function matchSpokenWord(
  transcript: string,
  words: readonly SpokenCandidate[],
): MatchResult {
  const said = normalize(transcript);
  if (!said || words.length === 0) return { matched: false, bestId: null };

  let nearestId: string | null = null;
  let nearestDist = Infinity;
  let embeddedId: string | null = null;
  let embeddedLen = -1;

  for (const word of words) {
    const en = normalize(word.en);
    if (!en) continue;
    if (en.length >= 3 && said.includes(en) && en.length > embeddedLen) {
      embeddedId = word.id;
      embeddedLen = en.length;
    }
    const dist = editDistance(said, en);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestId = word.id;
    }
  }

  if (embeddedId) return { matched: true, bestId: embeddedId };

  const nearestWord = words.find((w) => w.id === nearestId);
  const within = nearestWord ? nearestDist <= tolerance(normalize(nearestWord.en)) : false;
  return { matched: within, bestId: nearestId };
}
