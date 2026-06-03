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

export function splitForTts(text: string, maxLen: number = TTS_MAX_CHARS): string[] {
  // 按句末标点/换行切句并保留分隔符；空段过滤后拼接仍等于原文
  const sentences =
    text.match(/[^。！？!?；;\n]*[。！？!?；;\n]?/g)?.filter((s) => s.length) ?? [text];
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if (buf && Array.from(buf + s).length > chunkCap(chunks.length, maxLen)) {
      chunks.push(buf);
      buf = "";
    }
    if (Array.from(s).length > chunkCap(chunks.length, maxLen)) {
      // 单句仍超长（少见）：按当前段上限硬切
      const cs = Array.from(s);
      let i = 0;
      while (i < cs.length) {
        const c = chunkCap(chunks.length, maxLen);
        chunks.push(cs.slice(i, i + c).join(""));
        i += c;
      }
    } else {
      buf += s;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
