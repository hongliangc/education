import { auth } from "@/lib/auth";
import { isSpeechConfigured } from "@/lib/speech/server/client";
import { synthesizeStream, readTtsStreamCache } from "@/lib/speech/server/stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 流式语音合成：把腾讯云 WebSocket 的 mp3 帧直接作为 audio/mpeg 响应体边收边发，
// 浏览器 <audio> 边下边播（首声 ~1s）。未配置则 503，客户端回退整段合成 / Web Speech。
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!isSpeechConfigured()) {
    return new Response("speech_unconfigured", { status: 503 });
  }
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") ?? "").trim();
  if (!text) return new Response("text required", { status: 400 });
  const lang = searchParams.get("lang") ?? "zh-CN";
  const voiceRaw = Number(searchParams.get("voice"));
  const voice = Number.isFinite(voiceRaw) && voiceRaw > 0 ? voiceRaw : undefined;
  // pad=1：无 MediaSource 的客户端（iPhone Safari）用原生 <audio> 边下边播，需在尾部补静音抵消掐尾。
  const pad = searchParams.get("pad") === "1";

  try {
    // 缓存优先：命中则直接整段下发（带 Content-Length，浏览器即知时长→高亮准、无尾音截断），
    // 不再开 WS、不再合成、不扣额度。重听 / 其他孩子听同段即走此路。
    const cached = await readTtsStreamCache(text, { lang, voice });
    if (cached) {
      // 拷进独立 Uint8Array<ArrayBuffer>：Node 的 Buffer<ArrayBufferLike> 不满足 BodyInit
      const body = new Uint8Array(cached);
      return new Response(body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": String(body.byteLength),
          "Cache-Control": "no-store",
        },
      });
    }
    // 未命中：流式合成边收边发，合成完整(final=1)时由 synthesizeStream 落缓存。
    const stream = synthesizeStream(text, { lang, voice, pad });
    return new Response(stream, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        // 兜底告诉 nginx 不要缓冲本响应（nginx 已 proxy_buffering off，这里再保险）
        "X-Accel-Buffering": "no",
      },
    });
  } catch (e) {
    console.error("[tts-stream] failed:", e);
    return new Response("tts_failed", { status: 502 });
  }
}
