// Lenient, coverage-based judge for SENTENCE-level follow-along reading (双语阅读 跟读). A 3–10-year-old
// reading a 10–15 word English sentence aloud will slip on several words yet should still be encouraged
// onward — so whole-sentence edit distance (the word-level matcher in content/english/match.ts) is far
// too strict here. Instead we measure how many of the TARGET words the child actually hit — each word
// allowed a small mispronunciation tolerance — and pass at a forgiving coverage threshold.
//
// Pure leaf (no runtime imports) so the Node test runner loads it directly via its .ts path. Pairs with
// gradeAttempt (content/english/encourage.ts) for the encourage-first, never-block flow in the UI.

export interface SentenceMatch {
  /** Fraction of the target sentence's words that were recognized (0..1). */
  coverage: number;
  passed: boolean;
}

// Pass at half the words. Generous on purpose: the goal is to build the courage to read aloud, not to
// grade pronunciation. The UI still soft-passes after a second try regardless, so this only decides
// whether the first/second attempt earns the cheerful "read it!" vs a gentle retry.
const PASS_THRESHOLD = 0.5;

// Lowercase, drop punctuation/digits, collapse whitespace, split into words.
function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
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

// Short words tolerate one slipped sound; longer words tolerate two (same rule as the word matcher).
function tolerance(word: string): number {
  return word.length <= 4 ? 1 : 2;
}

/**
 * How well the child's ASR transcript covers the target sentence. Each target word is matched against
 * an as-yet-unused spoken word — exact or within edit-distance tolerance — so repeated target words
 * ("the … the") each need their own spoken word and one utterance can't cover them all. Empty speech
 * scores 0 (a miss). An empty target trivially passes (nothing to read).
 */
export function matchSpokenSentence(transcript: string, target: string): SentenceMatch {
  const targetWords = normalizeWords(target);
  if (targetWords.length === 0) return { coverage: 1, passed: true };

  const pool = normalizeWords(transcript);
  if (pool.length === 0) return { coverage: 0, passed: false };

  let hits = 0;
  for (const t of targetWords) {
    const idx = pool.findIndex((w) => w === t || editDistance(w, t) <= tolerance(t));
    if (idx >= 0) {
      hits += 1;
      pool.splice(idx, 1);
    }
  }

  const coverage = hits / targetWords.length;
  return { coverage, passed: coverage >= PASS_THRESHOLD };
}
