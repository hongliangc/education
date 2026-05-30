import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { synthesize } from "@/lib/speech/server/tts";
import { isSpeechConfigured } from "@/lib/speech/server/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSpeechConfigured()) {
    // 未配置 → 让客户端回退 Web Speech
    return NextResponse.json({ error: "speech_unconfigured" }, { status: 503 });
  }
  const { text, lang, voice } = await req.json().catch(() => ({}));
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text required" }, { status: 400 });
  }
  try {
    const { audioBase64, format } = await synthesize(text, {
      lang,
      voice: typeof voice === "number" ? voice : undefined,
    });
    return NextResponse.json({ audioBase64, format, source: "tencent" });
  } catch (e) {
    console.error("[tts] failed:", e);
    return NextResponse.json({ error: "tts_failed" }, { status: 502 });
  }
}
