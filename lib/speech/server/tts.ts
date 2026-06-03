import "server-only";
import { randomUUID } from "crypto";
import { ttsClient, isSpeechConfigured } from "./client";
import { ttsCacheKey, readTtsCache, writeTtsCache } from "../cache";
import { isValidVoice, DEFAULT_VOICE_ZH, DEFAULT_VOICE_EN } from "../voices";

// 默认音色（大模型音色，扣大模型预付费包）；可被 env 覆盖，或被请求里的 voice 覆盖。
const VOICE_ZH = Number(process.env.TTS_VOICE_ZH ?? DEFAULT_VOICE_ZH);
const VOICE_EN = Number(process.env.TTS_VOICE_EN ?? DEFAULT_VOICE_EN);

export interface TtsResult {
  audioBase64: string;
  format: "mp3";
}

export async function synthesize(
  text: string,
  opts: { lang?: string; voice?: number } = {},
): Promise<TtsResult> {
  if (!isSpeechConfigured()) throw new Error("speech not configured");
  const lang = opts.lang ?? "zh-CN";
  const isZh = lang.startsWith("zh");
  // 请求指定且在白名单内才用；否则按语言取默认音色
  const voice =
    opts.voice && isValidVoice(opts.voice) ? opts.voice : isZh ? VOICE_ZH : VOICE_EN;
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
