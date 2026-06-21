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

// 静音 MP3 帧（MPEG-2 Layer III, 16kHz 单声道, 与腾讯流同格式）：帧头 FF F3 48 C0 + 全 0 的
// 边信息/主数据（part2_3_length=0、big_values=0 → 解码即静音），每帧 144 字节 / 576 样本 ≈ 36ms。
const SILENCE_FRAME = 144;
function silentFrames(n: number): Buffer {
  const buf = Buffer.alloc(SILENCE_FRAME * n);
  for (let i = 0; i < n; i++) {
    const o = i * SILENCE_FRAME;
    buf[o] = 0xff;
    buf[o + 1] = 0xf3;
    buf[o + 2] = 0x48;
    buf[o + 3] = 0xc0;
  }
  return buf;
}
// ~0.5s 尾部静音：iPhone Safari 无 MediaSource，只能用原生 <audio> 边下边播；它对无 Content-Length
// 的流会「掐掉末尾几个字」。pad=1 时把这段静音拼到合成尾部，被掐掉的就是静音而非真正的最后几个字。
const SILENCE_MP3 = silentFrames(14);

// 首段「暖管线」前导静音：iPhone 原生 <audio> 在真实首帧到达前收不到任何字节，管线 ~0.8s 后才冷启动，
// 额外叠加 ~0.3-0.5s 原生启动缓冲（这就是「PC 快、iPhone 首段慢」的差值）。pad=1 时从 WS ready 起
// 持续下发小段静音「喂活」管线，真实首帧一到即无缝切真声 → 省掉 iOS 冷启动那一截、消除「卡死」感。
// 仅 pad（iOS 原生）路径；前导静音同样不写缓存。起点选 ready（握手已成）而非建流：握手前失败时
// currentTime 仍为 0 → 客户端 onerror 可正常回退 Web Speech，不被前导静音误判成「已出声」。
const LEAD_IN_TICK_MS = 120; // 每 120ms 补一口
const LEAD_IN_TICK_FRAMES = 4; // 每口 ~144ms 音频：略快于实时，留薄余量防欠载、又不堆积过多延时
const LEAD_IN_CHUNK = silentFrames(LEAD_IN_TICK_FRAMES);

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

/** 返回一段 mp3 字节流（ReadableStream），由路由直接作为 audio/mpeg 响应体下发。
 *  pad=true 时在合成结束后追加一小段静音（仅给 iPhone 原生边下边播抵消掐尾用），不写入缓存。 */
export function synthesizeStream(
  text: string,
  opts: { lang?: string; voice?: number; pad?: boolean } = {},
): ReadableStream<Uint8Array> {
  if (!isSpeechConfigured()) throw new Error("speech not configured");
  const lang = opts.lang ?? "zh-CN";
  const voice = resolveStreamVoice(lang, opts.voice);
  const { url, sessionId } = buildSignedUrl(voice);
  const cacheKey = ttsCacheKey(text, String(voice), lang);

  let ws: WebSocket | null = null;
  let closed = false;
  let firstReal = false; // 是否已收到第一帧真实音频（用于停掉前导静音）
  let leadIn: ReturnType<typeof setInterval> | null = null;
  const stopLeadIn = () => {
    if (leadIn) {
      clearInterval(leadIn);
      leadIn = null;
    }
  };
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
        stopLeadIn();
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
            // 暖管线：握手已成、合成已请求 → 从现在起持续下发前导静音喂活 iOS 原生播放管线，
            // 真实首帧一到即停（见下方二进制分支）。仅 pad（iOS 原生边下边播）路径需要。
            if (opts.pad && !leadIn && !firstReal) {
              const pump = () => {
                if (closed || firstReal) {
                  stopLeadIn();
                  return;
                }
                try {
                  controller.enqueue(new Uint8Array(LEAD_IN_CHUNK)); // 不进 parts → 不污染缓存
                } catch {
                  stopLeadIn();
                }
              };
              pump(); // 立刻喂第一口，元素尽快起播
              leadIn = setInterval(pump, LEAD_IN_TICK_MS);
            }
          }
          if (msg.final === 1) {
            // 完整结束：整段 mp3 落缓存（失败不影响播放）。缓存只存真实语音(parts)、不含静音尾巴——
            // 命中缓存走整段下发(带 Content-Length)本就不丢尾音。
            writeTtsCache(cacheKey, Buffer.concat(parts)).catch(() => {});
            // 边下边播的客户端(pad=1)：拼一小段静音再收尾，抵消 Safari 掐尾。
            if (opts.pad && !closed) {
              try {
                controller.enqueue(new Uint8Array(SILENCE_MP3));
              } catch {
                /* ignore */
              }
            }
            finish();
          }
          return;
        }
        // 二进制帧：mp3 音频（既下发浏览器，也累积以便 final 时落缓存）
        if (!closed) {
          // 第一帧真声 → 停掉前导静音，真声紧跟其后无缝衔接（不会在真声之间夹静音）。
          if (!firstReal) {
            firstReal = true;
            stopLeadIn();
          }
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
      stopLeadIn();
      try {
        ws?.close();
      } catch {
        /* ignore */
      }
    },
  });
}
