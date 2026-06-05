// 长文 TTS 分段：唯一切分逻辑来源（纯函数，无 DOM / 无 server-only）。
// 客户端朗读 speakChunks(lib/speech.ts) 用它把整章切段，逐段走流式端点合成 + 落缓存。
// 缓存键是 sha256(lang|voice|text)，所以**改动这里会改变每段文本 → 既有 TTS 缓存全部失效**，
// 下次播放各段会重新实时合成一次（之后又自动缓存）。改前请知悉这点。

export const TTS_MAX_CHARS = 148; // 留 2 字余量（腾讯云 REST TextToVoice 单次上限 150）

// 段长上限随段序由小变大：首段极短(快速出声)、次段稍短(趁首段播放时就合成好)，其后吃满上限。
export function chunkCap(k: number, maxLen: number): number {
  if (k === 0) return Math.min(24, maxLen);
  if (k === 1) return Math.min(60, maxLen);
  return maxLen;
}

const SENTENCE_ENDS = new Set(["。", "！", "？", "!", "?", "；", ";", "\n"]);
const CLOSING_QUOTES = new Set(["」", "』", "”", "’", "）", ")"]);
const CLAUSE_ENDS = new Set(["，", ",", "、", "：", ":", "—"]);
const WORD_SEGMENTER =
  typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("zh-CN", { granularity: "word" })
    : null;

function splitSentences(text: string): string[] {
  const chars = Array.from(text);
  const sentences: string[] = [];
  let start = 0;

  for (let i = 0; i < chars.length; i++) {
    if (!SENTENCE_ENDS.has(chars[i] ?? "")) continue;

    let end = i + 1;
    while (end < chars.length && CLOSING_QUOTES.has(chars[end] ?? "")) end++;
    sentences.push(chars.slice(start, end).join(""));
    start = end;
    i = end - 1;
  }

  if (start < chars.length) sentences.push(chars.slice(start).join(""));
  return sentences;
}

function lastBoundary(chars: string[], cap: number, boundaries: Set<string>): number {
  let cut = 0;
  const limit = Math.min(chars.length, cap);
  for (let i = 0; i < limit; i++) {
    if (boundaries.has(chars[i] ?? "")) cut = i + 1;
  }
  return cut;
}

function lastWordBoundary(chars: string[], cap: number): number {
  if (!WORD_SEGMENTER) return 0;

  let cut = 0;
  let position = 0;
  for (const part of WORD_SEGMENTER.segment(chars.join(""))) {
    position += Array.from(part.segment).length;
    if (position > cap) break;
    cut = position;
  }
  return cut;
}

function naturalCut(chars: string[], cap: number): number {
  if (chars.length <= cap) return chars.length;

  const sentenceCut = lastBoundary(chars, cap, SENTENCE_ENDS);
  if (sentenceCut > 0) {
    let cut = sentenceCut;
    while (cut < cap && CLOSING_QUOTES.has(chars[cut] ?? "")) cut++;
    return cut;
  }

  const clauseCut = lastBoundary(chars, cap, CLAUSE_ENDS);
  if (clauseCut > 0) return clauseCut;

  return lastWordBoundary(chars, cap) || cap;
}

export function splitForTts(text: string, maxLen: number = TTS_MAX_CHARS): string[] {
  // 先保留完整句子；超长句再按自然停顿/词边界切，最后才退回精确字符上限。
  const sentences = splitSentences(text);
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && Array.from(buf + s).length > chunkCap(chunks.length, maxLen)) {
      chunks.push(buf);
      buf = "";
    }
    if (Array.from(s).length > chunkCap(chunks.length, maxLen)) {
      const cs = Array.from(s);
      let i = 0;
      while (i < cs.length) {
        const c = chunkCap(chunks.length, maxLen);
        const cut = naturalCut(cs.slice(i), c);
        chunks.push(cs.slice(i, i + cut).join(""));
        i += cut;
      }
    } else {
      buf += s;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
