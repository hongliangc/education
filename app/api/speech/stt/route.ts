import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { recognize } from "@/lib/speech/server/stt";
import { isSpeechConfigured } from "@/lib/speech/server/client";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSpeechConfigured()) {
    return NextResponse.json({ error: "speech_unconfigured" }, { status: 503 });
  }
  const { audioBase64, lang, format } = await req.json().catch(() => ({}));
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return NextResponse.json({ error: "audioBase64 required" }, { status: 400 });
  }
  try {
    const { text } = await recognize(audioBase64, { lang, format });
    return NextResponse.json({ text, source: "tencent" });
  } catch (e) {
    console.error("[stt] failed:", e);
    return NextResponse.json({ error: "stt_failed" }, { status: 502 });
  }
}
