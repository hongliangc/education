export interface SubLine {
  start: number;
  end: number;
  text: string;
}

interface Segment {
  start: number;
  end: number;
}

const MAX_LINE_CHARS = 24;
const MIN_VISIBLE_CHARS = 6;
const BOUNDARY_CHARS = new Set(["。", "！", "？", "!", "?", "；", ";", "，", "、", "\n"]);

function visibleLength(chars: string[], segment: Segment): number {
  let count = 0;
  for (let i = segment.start; i < segment.end; i++) {
    if (!/\s/u.test(chars[i] ?? "")) count++;
  }
  return count;
}

function lineText(chars: string[], segment: Segment): string {
  return chars.slice(segment.start, segment.end).join("").replace(/\s+/gu, " ").trim();
}

export function subtitleLines(text: string): SubLine[] {
  const chars = Array.from(text);
  if (chars.length === 0) return [];

  const segments: Segment[] = [];
  let start = 0;

  for (let i = 0; i < chars.length; i++) {
    const length = i + 1 - start;
    if (BOUNDARY_CHARS.has(chars[i] ?? "") || length >= MAX_LINE_CHARS) {
      segments.push({ start, end: i + 1 });
      start = i + 1;
    }
  }

  if (start < chars.length) {
    segments.push({ start, end: chars.length });
  }

  for (let i = 0; i < segments.length; i++) {
    if (visibleLength(chars, segments[i] as Segment) >= MIN_VISIBLE_CHARS) continue;

    if (i > 0) {
      segments[i - 1] = { start: (segments[i - 1] as Segment).start, end: (segments[i] as Segment).end };
      segments.splice(i, 1);
      i--;
    } else if (segments.length > 1) {
      segments[1] = { start: segments[0].start, end: (segments[1] as Segment).end };
      segments.splice(0, 1);
      i--;
    }
  }

  return segments.map((segment) => ({
    start: segment.start,
    end: segment.end,
    text: lineText(chars, segment),
  }));
}
