import { auth } from "@/lib/auth";
import { isSpeechConfigured } from "@/lib/speech/server/client";
import { synthesizeStream } from "@/lib/speech/server/stream";

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

  try {
    const stream = synthesizeStream(text, { lang, voice });
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
