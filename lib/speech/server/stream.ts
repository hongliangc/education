import "server-only";
import { createHmac, randomUUID } from "crypto";
import { isSpeechConfigured } from "./client";
import { isValidVoice, DEFAULT_VOICE_ZH, DEFAULT_VOICE_EN } from "../voices";

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
  const isZh = lang.startsWith("zh");
  const voice =
    opts.voice && isValidVoice(opts.voice) ? opts.voice : isZh ? VOICE_ZH : VOICE_EN;
  const { url, sessionId } = buildSignedUrl(voice);

  let ws: WebSocket | null = null;
  let closed = false;

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
          if (msg.final === 1) finish();
          return;
        }
        // 二进制帧：mp3 音频
        if (!closed) controller.enqueue(new Uint8Array(ev.data as ArrayBuffer));
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
