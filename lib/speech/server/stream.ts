import "server-only";
import { createHmac, randomUUID } from "crypto";
import { isSpeechConfigured } from "./client";
import { voiceMatchesLang, DEFAULT_VOICE_ZH, DEFAULT_VOICE_EN } from "../voices";
import { ttsCacheKey, readTtsCache, writeTtsCache } from "../cache";

// 流式文本语音合成（边合成边播）：腾讯云 WebSocket stream_wsv2，大模型音色支持。
// 相比 REST TextToVoice（整段合成，首声 ~4.7s），首块音频 ~1s 即到。密钥只在服务端。
// 协议：握手(签名) → 收到 ready=1 → 发 ACTION_SYNTHESIS + ACTION_COMPLETE → 收二进制 mp3 帧 → final=1。

const HOST = "tts.cloud.tencent.com";
const WS_PATH = "/stream_wsv2";
const SECRET_ID = process.env.TENCENT_SECRETID;
const SECRET_KEY = process.env.TENCENT_SECRETKEY;
// AppId 是账号级公开标识（非密钥）；可被 env 覆盖，缺省用本账号 appid。
const APP_ID = process.env.TENCENT_APPID ?? "1307984055";
const VOICE_ZH = Number(process.env.TTS_VOICE_ZH ?? DEFAULT_VOICE_ZH);
const VOICE_EN = Number(process.env.TTS_VOICE_EN ?? DEFAULT_VOICE_EN);

// 音色解析（路由查缓存键 与 synthesizeStream 合成/写缓存 必须用同一份 → 同一段文必然同一 key）。
export function resolveStreamVoice(lang: string, voice?: number): number {
  const isZh = (lang ?? "zh-CN").startsWith("zh");
  // 音色语言与朗读语言匹配才用，否则回落该语言默认（避免中文音色念英文，反之亦然）
  return voice && voiceMatchesLang(voice, lang ?? "zh-CN") ? voice : isZh ? VOICE_ZH : VOICE_EN;
}

// 路由「缓存优先」用：命中则返回整段 mp3（带 Content-Length，浏览器即知时长），不必开 WS。
// 与 REST synthesize 共用同一 ttsCache：谁先合成谁落盘，之后两条路径都命中。
export async function readTtsStreamCache(
  text: string,
  opts: { lang?: string; voice?: number } = {},
): Promise<Buffer | null> {
  const lang = opts.lang ?? "zh-CN";
  const voice = resolveStreamVoice(lang, opts.voice);
  return readTtsCache(ttsCacheKey(text, String(voice), lang));
}

function buildSignedUrl(voice: number): { url: string; sessionId: string } {
  const sessionId = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    Action: "TextToStreamAudioWSv2",
    AppId: APP_ID,
    Codec: "mp3",
    Expired: now + 86400,
    SampleRate: 16000,
    SecretId: SECRET_ID!,
    SessionId: sessionId,
    Timestamp: now,
    VoiceType: voice,
  };
  // 签名串：GET + 域名 + 路径 + ? + 按 key 字典序拼接的参数；HMAC-SHA1→base64→URL 编码。
  const qs = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  const sig = createHmac("sha1", SECRET_KEY!)
    .update(`GET${HOST}${WS_PATH}?${qs}`)
    .digest("base64");
  return {
    url: `wss://${HOST}${WS_PATH}?${qs}&Signature=${encodeURIComponent(sig)}`,
    sessionId,
  };
}

/** 返回一段 mp3 字节流（ReadableStream），由路由直接作为 audio/mpeg 响应体下发。 */
export function synthesizeStream(
  text: string,
  opts: { lang?: string; voice?: number } = {},
): ReadableStream<Uint8Array> {
  if (!isSpeechConfigured()) throw new Error("speech not configured");
  const lang = opts.lang ?? "zh-CN";
  const voice = resolveStreamVoice(lang, opts.voice);
  const { url, sessionId } = buildSignedUrl(voice);
  const cacheKey = ttsCacheKey(text, String(voice), lang);

  let ws: WebSocket | null = null;
  let closed = false;
  // 累积所有 mp3 帧：仅在收到 final=1（完整结束）时整段落缓存；
  // 出错 / ws 异常关闭 / 客户端中断(cancel) 都不写 → 绝不缓存半段。
  const parts: Uint8Array[] = [];

  return new ReadableStream<Uint8Array>({
    start(controller) {
      ws = new WebSocket(url);
      ws.binaryType = "arraybuffer";

      const finish = (err?: unknown) => {
        if (closed) return;
        closed = true;
        try {
          ws?.close();
        } catch {
          /* ignore */
        }
        if (err) controller.error(err);
        else controller.close();
      };

      ws.addEventListener("message", (ev: MessageEvent) => {
        // 文本帧：JSON 事件（ready / final / 错误）
        if (typeof ev.data === "string") {
          let msg: { code?: number; message?: string; ready?: number; final?: number };
          try {
            msg = JSON.parse(ev.data);
          } catch {
            return;
          }
          if (msg.code !== 0) {
            finish(new Error(`tts ws code ${msg.code}: ${msg.message ?? ""}`));
            return;
          }
          if (msg.ready === 1) {
            ws?.send(
              JSON.stringify({
                session_id: sessionId,
                message_id: randomUUID(),
                action: "ACTION_SYNTHESIS",
                data: text,
              }),
            );
            ws?.send(
              JSON.stringify({
                session_id: sessionId,
                message_id: randomUUID(),
                action: "ACTION_COMPLETE",
                data: "",
              }),
            );
          }
          if (msg.final === 1) {
            // 完整结束：整段 mp3 落缓存（失败不影响播放），再关闭流
            writeTtsCache(cacheKey, Buffer.concat(parts)).catch(() => {});
            finish();
          }
          return;
        }
        // 二进制帧：mp3 音频（既下发浏览器，也累积以便 final 时落缓存）
        if (!closed) {
          const bytes = new Uint8Array(ev.data as ArrayBuffer);
          parts.push(bytes);
          controller.enqueue(bytes);
        }
      });

      ws.addEventListener("error", () => finish(new Error("tts ws error")));
      ws.addEventListener("close", () => finish());
    },
    cancel() {
      // 客户端断开（换下一句 / 关闭弹层）→ 关掉上游 WS，停止计费。
      closed = true;
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    },
  });
}
