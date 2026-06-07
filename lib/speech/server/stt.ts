import "server-only";
import { randomUUID } from "crypto";
import { asrClient, isSpeechConfigured } from "./client";
import { buildRecognitionOptions } from "./stt-options";

// 一句话识别 SentenceRecognition：SourceType=1 表示直接传音频数据(base64)。
// EngSerViceType 与 TTS 的 16k 采样率保持一致(16k_zh / 16k_en)。
export async function recognize(
  audioBase64: string,
  opts: { lang?: string; format?: string } = {},
): Promise<{ text: string }> {
  if (!isSpeechConfigured()) throw new Error("speech not configured");
  const bytes = Buffer.from(audioBase64, "base64");
  const recognitionOptions = buildRecognitionOptions({
    lang: opts.lang,
    format: opts.format,
    zhEngine: process.env.TENCENT_ASR_ENGINE,
    zhHotwords: process.env.TENCENT_ASR_HOTWORDS,
  });
  const res = await asrClient().SentenceRecognition({
    ...recognitionOptions,
    SourceType: 1,
    UsrAudioKey: randomUUID(),
    Data: audioBase64,
    DataLen: bytes.length,
  });
  return { text: (res.Result as string) ?? "" };
}
