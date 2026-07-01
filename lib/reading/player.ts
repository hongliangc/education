const EN_WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g;

export function splitEnglishWords(text: string): string[] {
  return text.match(EN_WORD_RE) ?? [];
}

export function splitHanChars(text: string): string[] {
  return text.match(/\p{Script=Han}/gu) ?? [];
}

export function currentTokenIndex(tokenCount: number, fraction: number): number {
  if (tokenCount <= 0) return -1;
  const safeFraction = Math.min(1, Math.max(0, fraction));
  return Math.min(tokenCount - 1, Math.floor(safeFraction * tokenCount));
}

export function readingProgressValue(sentenceIndex: number, clipFraction: number): number {
  return sentenceIndex + Math.min(1, Math.max(0, clipFraction));
}

export function activeIllustrationIndex(
  sentenceIds: readonly string[],
  illustrationAnchors: readonly string[],
  sentenceIndex: number,
): number {
  if (illustrationAnchors.length === 0) return -1;
  let current = 0;
  illustrationAnchors.forEach((anchor, i) => {
    const startsAt = sentenceIds.indexOf(anchor);
    if (startsAt >= 0 && startsAt <= sentenceIndex) current = i;
  });
  return current;
}

export function illustrationSentenceIndex(
  sentenceIds: readonly string[],
  illustrationAnchors: readonly string[],
  illustrationIndex: number,
): number {
  if (sentenceIds.length === 0 || illustrationAnchors.length === 0) return 0;
  const safeIllustrationIndex = Math.min(
    illustrationAnchors.length - 1,
    Math.max(0, illustrationIndex),
  );
  const index = sentenceIds.indexOf(illustrationAnchors[safeIllustrationIndex] ?? "");
  return index >= 0 ? index : 0;
}

export type SubtitleMode = "both" | "english" | "chinese" | "hidden";

export function nextSubtitleMode(mode: SubtitleMode): SubtitleMode {
  if (mode === "both") return "english";
  if (mode === "english") return "chinese";
  if (mode === "chinese") return "hidden";
  return "both";
}
