import "server-only";
import { randomUUID } from "crypto";
import { ttsClient, isSpeechConfigured } from "./client";
import { ttsCacheKey, readTtsCache, writeTtsCache } from "../cache";

// 音色 id 见腾讯云音色列表 https://cloud.tencent.com/document/product/1073/92668
// 默认值可被 env 覆盖；Task 6 集成测试时对真实账号确认/微调为童声。
const VOICE_ZH = Number(process.env.TTS_VOICE_ZH ?? 101016);
const VOICE_EN = Number(process.env.TTS_VOICE_EN ?? 101050);

export interface TtsResult {
  audioBase64: string;
  format: "mp3";
}

export async function synthesize(
  text: string,
  opts: { lang?: string } = {},
): Promise<TtsResult> {
  if (!isSpeechConfigured()) throw new Error("speech not configured");
  const lang = opts.lang ?? "zh-CN";
  const isZh = lang.startsWith("zh");
  const voice = isZh ? VOICE_ZH : VOICE_EN;
  const key = ttsCacheKey(text, String(voice), lang);

  const cached = await readTtsCache(key);
  if (cached) return { audioBase64: cached.toString("base64"), format: "mp3" };

  const res = await ttsClient().TextToVoice({
    Text: text,
    SessionId: randomUUID(),
    VoiceType: voice,
    Codec: "mp3",
    SampleRate: 16000,
    PrimaryLanguage: isZh ? 1 : 2,
  });
  const audioBase64 = res.Audio as string;
  await writeTtsCache(key, Buffer.from(audioBase64, "base64"));
  return { audioBase64, format: "mp3" };
}
