// 语音封装：朗读优先走腾讯云大模型 TTS（真实童声），失败优雅回退 Web Speech；
// STT 走云端「一句话识别」。对外导出签名保持稳定，games / StoryPlayer 仅需用新的 controller。
"use client";

import { DEFAULT_VOICE_ZH, DEFAULT_VOICE_EN } from "./speech/voices";
import { TTS_MAX_CHARS, splitForTts } from "./speech/chunking";

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  voice?: number; // 腾讯云大模型音色 id；不传则用用户偏好/默认
  onWord?: (index: number, word: string) => void;
  onEnd?: () => void;
}

/** 一次朗读的控制器：支持暂停/继续/停止（暂停保留进度，可从原处继续）。 */
export interface SpeechController {
  pause(): void;
  resume(): void;
  stop(): void;
}

// ---------- 音色偏好（localStorage） ----------
const VOICE_PREF_KEY = "mlk:ttsVoice";

export function getVoicePref(): number | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(VOICE_PREF_KEY);
  return v ? Number(v) : null;
}

export function setVoicePref(id: number): void {
  if (typeof window !== "undefined") window.localStorage.setItem(VOICE_PREF_KEY, String(id));
}

function resolveVoice(lang: string, explicit?: number): number {
  if (explicit) return explicit;
  const pref = getVoicePref();
  if (pref) return pref;
  return lang.startsWith("zh") ? DEFAULT_VOICE_ZH : DEFAULT_VOICE_EN;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function tokenize(text: string, lang: string): string[] {
  return lang.startsWith("zh")
    ? Array.from(text)
    : text.split(/(\s+|[.,!?；。！？])/).filter((s) => s.trim().length);
}

// ---------- Web Speech 回退 ----------
let voicesCache: SpeechSynthesisVoice[] = [];
function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve([]);
    const v = window.speechSynthesis.getVoices();
    if (v.length) {
      voicesCache = v;
      return resolve(v);
    }
    const timer = setTimeout(() => {
      voicesCache = window.speechSynthesis.getVoices();
      resolve(voicesCache);
    }, 250);
    window.speechSynthesis.onvoiceschanged = () => {
      voicesCache = window.speechSynthesis.getVoices();
      clearTimeout(timer);
      resolve(voicesCache);
    };
  });
}

function pickVoice(lang: string) {
  const all = voicesCache.length
    ? voicesCache
    : typeof window === "undefined"
    ? []
    : window.speechSynthesis.getVoices();
  const langPrefix = lang.slice(0, 2);
  return (
    all.find(
      (v) =>
        v.lang.startsWith(langPrefix) &&
        (v.name.includes("Tingting") ||
          v.name.includes("Xiaoxiao") ||
          v.name.includes("Ting") ||
          v.name.includes("Google") ||
          v.localService),
    ) ?? all.find((v) => v.lang.startsWith(langPrefix))
  );
}

// ---------- 云 TTS 主路径 ----------
let currentAudio: HTMLAudioElement | null = null;
// 本会话一旦探测到云 TTS 不可用（未配置/网络错误），后续直接回退，避免每次朗读都先卡一下。
let cloudTtsUnavailable = false;

/**
 * 朗读一段文字，返回控制器。先试云 TTS（真实童声）→ 失败回退 Web Speech。
 * 逐词高亮由实际音频进度驱动（与发音同步、暂停即停、继续即续）。
 */
export function speakText(text: string, opts: SpeakOptions = {}): SpeechController {
  const lang = opts.lang ?? "zh-CN";
  const tokens = tokenize(text, lang);

  let aborted = false;
  let userPaused = false;
  let audio: HTMLAudioElement | null = null;
  let rafId: number | null = null;

  const ac = new AbortController();
  const stopRaf = () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  // 由 audio.currentTime 推进高亮：和真实音频长度成比例，暂停时自然停住
  const tick = (a: HTMLAudioElement) => {
    if (aborted || a.paused || a.ended) {
      rafId = null;
      return;
    }
    if (a.duration && opts.onWord) {
      const idx = Math.min(
        tokens.length - 1,
        Math.floor((a.currentTime / a.duration) * tokens.length),
      );
      opts.onWord(idx, tokens[idx] ?? "");
    }
    rafId = requestAnimationFrame(() => tick(a));
  };

  // ---- Web Speech 回退（带可暂停的定时高亮） ----
  let ssTimer: ReturnType<typeof setInterval> | null = null;
  let ssIdx = 0;
  const stopSsTimer = () => {
    if (ssTimer) clearInterval(ssTimer);
    ssTimer = null;
  };
  const startSsTimer = () => {
    if (!opts.onWord || ssTimer) return;
    const rate = opts.rate ?? 1;
    const perChar = lang.startsWith("zh") ? 230 : 280;
    const intervalMs = Math.max(80, perChar / rate);
    ssTimer = setInterval(() => {
      if (ssIdx < tokens.length) {
        opts.onWord?.(ssIdx, tokens[ssIdx]);
        ssIdx++;
      } else {
        stopSsTimer();
      }
    }, intervalMs);
  };
  async function fallbackWebSpeech() {
    if (!isSpeechSupported()) {
      opts.onEnd?.();
      return;
    }
    await ensureVoicesLoaded();
    if (aborted) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = opts.rate ?? 1;
    utter.pitch = opts.pitch ?? 1.05;
    const v = pickVoice(lang);
    if (v) utter.voice = v;
    utter.onend = () => {
      stopSsTimer();
      opts.onEnd?.();
    };
    utter.onerror = () => {
      stopSsTimer();
      opts.onEnd?.();
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    if (!userPaused) startSsTimer();
  }

  // 启动（异步获取音频；可被 stop() 在合成期间中止）
  (async () => {
    if (!cloudTtsUnavailable) {
      try {
        const res = await fetch("/api/speech/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text, lang, voice: resolveVoice(lang, opts.voice) }),
          signal: ac.signal,
        });
        if (aborted) return;
        if (res.ok) {
          const { audioBase64, format } = await res.json();
          if (aborted) return;
          stopSpeaking(); // 停掉其它正在播的
          const a = new Audio(`data:audio/${format};base64,${audioBase64}`);
          audio = a;
          currentAudio = a;
          if (opts.rate && opts.rate !== 1) a.playbackRate = opts.rate; // 语速按钮对云音频也生效
          const finish = () => {
            stopRaf();
            if (currentAudio === a) currentAudio = null;
            opts.onEnd?.();
          };
          a.onended = finish;
          a.onerror = finish;
          a.onplay = () => {
            stopRaf();
            rafId = requestAnimationFrame(() => tick(a));
          };
          if (!userPaused) {
            try {
              await a.play();
            } catch {
              // 自动播放被浏览器拦截（播放已脱离用户手势的同步栈，常见于
              // 录音→识别→对话→TTS 多次 await 之后）：被拒的 play() 既不会
              // 触发 onended 也不会触发 onerror → onEnd 永不回调 → 上层永久卡在
              // 「说话中」。这里丢掉这段播不响的云音频，回退 Web Speech（对自动
              // 播放更宽松），它播完/出错都会回调 onEnd，让 UI 恢复可交互。
              if (aborted) return;
              if (currentAudio === a) currentAudio = null;
              audio = null;
              void fallbackWebSpeech();
            }
          }
          return;
        }
        if (res.status === 503) cloudTtsUnavailable = true;
      } catch (e) {
        if (aborted) return;
        if ((e as { name?: string })?.name !== "AbortError") cloudTtsUnavailable = true;
      }
    }
    if (aborted) return;
    void fallbackWebSpeech();
  })();

  return {
    pause() {
      userPaused = true;
      if (audio) {
        audio.pause(); // 保留 currentTime；tick 因 paused 自然停止
      } else {
        stopSsTimer();
        if (isSpeechSupported()) window.speechSynthesis.pause();
      }
    },
    resume() {
      userPaused = false;
      if (audio) {
        void audio.play().catch(() => {}); // onplay 会重启高亮
      } else if (isSpeechSupported()) {
        window.speechSynthesis.resume();
        startSsTimer();
      }
    },
    stop() {
      aborted = true;
      ac.abort();
      stopRaf();
      stopSsTimer();
      if (audio) {
        audio.pause();
        if (currentAudio === audio) currentAudio = null;
        audio = null;
      }
      if (isSpeechSupported()) window.speechSynthesis.cancel();
    },
  };
}

/** 立即停掉所有朗读（云音频 + Web Speech）。用于切场景 / 单字点读前清场。 */
export function stopSpeaking(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/**
 * 流式朗读：边收边播腾讯云流式 TTS。用 MediaSource 渐进追加 mp3 分块，首声 ~0.6s
 * （远快于整段 ~4.7s），并在流结束时 `endOfStream()` 收尾——否则裸 <audio> 播放无
 * Content-Length 的分块流会算错时长、丢掉尾音（精灵语音末尾几个字听不到的根因）。
 * MSE 不支持 audio/mpeg 的浏览器（如 Firefox）→ 整段 Blob 播放（时长准确、不丢尾音）。
 * 取流失败 / 自动播放被拦 → 回退整段 speakText（其内部再回退 Web Speech）。
 * 不做逐词高亮（对话不需要）；控制器 pause/resume/stop 与 speakText 同形。
 */
export function speakTextStream(text: string, opts: SpeakOptions = {}): SpeechController {
  const lang = opts.lang ?? "zh-CN";
  if (cloudTtsUnavailable || typeof window === "undefined") return speakText(text, opts);

  const url = `/api/speech/tts-stream?${new URLSearchParams({
    text,
    lang,
    voice: String(resolveVoice(lang, opts.voice)),
  }).toString()}`;
  const canMse =
    typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg");

  let aborted = false;
  let ended = false;
  let paused = false; // pause() 可能在音频还没 attach（首块缓冲中）时就被调用——记下来，
  // attach 时据此决定是否自动播放，避免「缓冲期间按下的暂停被丢、音频照样起播」。
  let inner: SpeechController | null = null; // 回退后的整段控制器
  let audio: HTMLAudioElement | null = null;
  let objUrl: string | null = null;
  const ac = new AbortController();

  // 逐词高亮（故事朗读用）：由真实音频进度驱动；MSE 流式期间 duration 尚未定，
  // 先用按字数估算的总时长兜底，endOfStream 后自动切到真实 duration 并校正位置。
  const hlTokens = opts.onWord ? tokenize(text, lang) : [];
  const PER_TOKEN = lang.startsWith("zh") ? 0.2 : 0.32;
  let rafId: number | null = null;
  const stopRaf = () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
  };
  const tick = (a: HTMLAudioElement) => {
    if (aborted || a.paused || a.ended) {
      rafId = null;
      return;
    }
    if (opts.onWord && hlTokens.length) {
      const dur =
        Number.isFinite(a.duration) && a.duration > 0
          ? a.duration
          : hlTokens.length * PER_TOKEN;
      const idx = Math.min(
        hlTokens.length - 1,
        Math.floor((a.currentTime / dur) * hlTokens.length),
      );
      opts.onWord(idx, hlTokens[idx] ?? "");
    }
    rafId = requestAnimationFrame(() => tick(a));
  };

  const cleanup = () => {
    if (objUrl) {
      URL.revokeObjectURL(objUrl);
      objUrl = null;
    }
  };
  const endNow = () => {
    if (ended) return;
    ended = true;
    stopRaf();
    if (audio && currentAudio === audio) currentAudio = null;
    cleanup();
    opts.onEnd?.();
  };
  const fallbackWhole = () => {
    if (aborted || inner || ended) return;
    cleanup();
    inner = speakText(text, opts); // onEnd 改由 inner 触发
    if (paused) inner.pause(); // 暂停状态下回退：别让整段控制器自动播起来
  };
  const attach = (a: HTMLAudioElement) => {
    audio = a;
    currentAudio = a;
    if (opts.rate && opts.rate !== 1) a.playbackRate = opts.rate; // 语速按钮对云音频也生效
    a.onended = endNow;
    a.onerror = endNow; // 已接上音频，出错也当结束，避免卡在 speaking
    a.onplay = () => {
      stopRaf();
      rafId = requestAnimationFrame(() => tick(a));
    };
    if (paused) return; // 缓冲期间已被暂停：接好音频但先不播，等 resume() 再 play()
    a.play().catch(() => {
      // 自动播放被拦 → 放弃流式，回退整段（其内部再回退 Web Speech）
      if (currentAudio === a) currentAudio = null;
      audio = null;
      try {
        ac.abort();
      } catch {
        /* ignore */
      }
      fallbackWhole();
    });
  };

  void (async () => {
    try {
      const res = await fetch(url, { signal: ac.signal });
      if (aborted) return;
      if (!res.ok || !res.body) {
        fallbackWhole();
        return;
      }
      stopSpeaking(); // 停掉其它正在播的

      if (!canMse) {
        const blob = await res.blob(); // 整段下完再播：时长准确、不丢尾音
        if (aborted) return;
        if (!blob.size) {
          fallbackWhole();
          return;
        }
        objUrl = URL.createObjectURL(blob);
        attach(new Audio(objUrl));
        return;
      }

      const ms = new MediaSource();
      objUrl = URL.createObjectURL(ms);
      attach(new Audio(objUrl));
      await new Promise<void>((resolve) =>
        ms.addEventListener("sourceopen", () => resolve(), { once: true }),
      );
      if (aborted) return;
      const sb = ms.addSourceBuffer("audio/mpeg");
      const appendChunk = (chunk: Uint8Array) =>
        new Promise<void>((resolve, reject) => {
          const ok = () => {
            sb.removeEventListener("updateend", ok);
            sb.removeEventListener("error", no);
            resolve();
          };
          const no = () => {
            sb.removeEventListener("updateend", ok);
            sb.removeEventListener("error", no);
            reject(new Error("sourcebuffer append error"));
          };
          sb.addEventListener("updateend", ok);
          sb.addEventListener("error", no);
          // 拷进独立 ArrayBuffer：reader 给的 Uint8Array 泛型是 ArrayBufferLike，
          // 不直接满足 appendBuffer 的 BufferSource（ArrayBuffer）类型。
          const buf = new ArrayBuffer(chunk.byteLength);
          new Uint8Array(buf).set(chunk);
          sb.appendBuffer(buf);
        });

      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (aborted) {
          try {
            await reader.cancel();
          } catch {
            /* ignore */
          }
          return;
        }
        if (done) break;
        if (value) await appendChunk(value);
      }
      // 关键：流结束时收尾，duration 才定得下来，尾音才会播完
      if (!aborted && ms.readyState === "open") {
        if (sb.updating) {
          await new Promise((r) =>
            sb.addEventListener("updateend", () => r(null), { once: true }),
          );
        }
        ms.endOfStream();
      }
    } catch (e) {
      if (aborted || (e as { name?: string })?.name === "AbortError") return;
      // 建链阶段失败（还没接上音频元素）→ 回退整段；已接上 → 当作结束让 UI 恢复
      if (!audio) fallbackWhole();
      else endNow();
    }
  })();

  return {
    pause() {
      paused = true;
      if (inner) inner.pause();
      else audio?.pause();
    },
    resume() {
      paused = false;
      if (inner) inner.resume();
      else void audio?.play().catch(() => {});
    },
    stop() {
      aborted = true;
      stopRaf();
      try {
        ac.abort();
      } catch {
        /* ignore */
      }
      if (inner) {
        inner.stop();
        return;
      }
      if (audio) {
        audio.pause();
        if (currentAudio === audio) currentAudio = null;
        audio = null;
      }
      cleanup();
    },
  };
}

// ---------- 长文分段朗读（故事整章用） ----------
// 按句切段后逐段走**流式端点** /api/speech/tts-stream（边合成边播，首声 ~0.6–1s，
// 远快于整段 REST 的 ~4.7s），服务端在每段合成完整时落缓存——首听按需实时合成、之后
// 重听/其他孩子听同段即缓存命中(~7ms、免合成、免扣额度)。播当前段时并发预取下一段
// （同时藏住段间等待 + 在服务端预热缓存）。各段拼接 === 原文，onWord 用全局字符索引高亮。
// 切分逻辑(splitForTts/chunkCap/TTS_MAX_CHARS)抽在 ./speech/chunking，与服务端缓存键一致。

/**
 * 分段朗读长文：按句切段(首段短→快速出声)，逐段走流式 TTS(边收边播、MSE 渐进追加)；
 * **播当前段时并发预取下一段**，段间近乎无缝。首听实时合成并落缓存，重听走缓存秒开免扣额度。
 * onWord 用全局字符索引；pause/resume/stop 与 speakText 同形。
 */
export function speakChunks(
  text: string,
  opts: SpeakOptions & { maxLen?: number } = {},
): SpeechController {
  const lang = opts.lang ?? "zh-CN";
  const chunks = splitForTts(text, opts.maxLen ?? TTS_MAX_CHARS);
  const voice = resolveVoice(lang, opts.voice);

  // 每段首字符在全局 Array.from(text) 中的偏移 + 每段 token（高亮用）
  const offsets: number[] = [];
  const tokensPer: string[][] = [];
  let acc = 0;
  for (const c of chunks) {
    offsets.push(acc);
    tokensPer.push(tokenize(c, lang));
    acc += Array.from(c).length;
  }

  let stopped = false;
  let paused = false;
  let idx = 0;
  let pendingNext: number | null = null;
  let curAudio: HTMLAudioElement | null = null;
  let curCtrl: SpeechController | null = null; // 某段云端失败时回退 speakText 的控制器
  let rafId: number | null = null;
  const ac = new AbortController();
  const audioCache: Array<Promise<HTMLAudioElement | null> | undefined> = [];
  const objUrls: Array<string | null> = []; // 每段 blob / MediaSource 的 objectURL，stop/段末回收
  const canMse =
    typeof MediaSource !== "undefined" && MediaSource.isTypeSupported("audio/mpeg");

  const stopRaf = () => {
    if (rafId != null) cancelAnimationFrame(rafId);
    rafId = null;
  };

  const revoke = (k: number) => {
    if (objUrls[k]) {
      URL.revokeObjectURL(objUrls[k]!);
      objUrls[k] = null;
    }
  };

  // 预取第 k 段音频（只取不播）：走流式端点 /api/speech/tts-stream。
  // 命中缓存→整段 mp3（带 Content-Length，时长已知）；未命中→MSE 渐进追加(边收边播)，
  // 服务端在 final 时落缓存（重听免合成）。返回的 Promise 在「首帧就绪 / 整段就绪」时 resolve，
  // 失败 / 空流 / 未配置 → null，调用方回退 speakText。
  const fetchAudio = (k: number): Promise<HTMLAudioElement | null> => {
    if (audioCache[k]) return audioCache[k]!;
    const p = (async (): Promise<HTMLAudioElement | null> => {
      try {
        const url = `/api/speech/tts-stream?${new URLSearchParams({
          text: chunks[k],
          lang,
          voice: String(voice),
        }).toString()}`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok || !res.body) return null;

        // 命中缓存（整段、带长度）或浏览器不支持 MSE → 整段 Blob：时长准确、不丢尾音。
        if (res.headers.get("content-length") != null || !canMse) {
          const blob = await res.blob();
          if (!blob.size) return null;
          objUrls[k] = URL.createObjectURL(blob);
          const a = new Audio(objUrls[k]!);
          if (opts.rate && opts.rate !== 1) a.playbackRate = opts.rate;
          return a;
        }

        // 未命中：MSE 渐进追加。首帧到达即 resolve（首声快），其余在后台继续灌入。
        const ms = new MediaSource();
        objUrls[k] = URL.createObjectURL(ms);
        const a = new Audio(objUrls[k]!);
        if (opts.rate && opts.rate !== 1) a.playbackRate = opts.rate;
        const body = res.body;
        let firstResolve!: () => void;
        let firstReject!: (e: unknown) => void;
        const firstFrame = new Promise<void>((rs, rj) => {
          firstResolve = rs;
          firstReject = rj;
        });
        void (async () => {
          try {
            await new Promise<void>((resolve) =>
              ms.addEventListener("sourceopen", () => resolve(), { once: true }),
            );
            if (stopped) {
              firstReject(new Error("stopped"));
              return;
            }
            const sb = ms.addSourceBuffer("audio/mpeg");
            const appendChunk = (chunk: Uint8Array) =>
              new Promise<void>((resolve, reject) => {
                const ok = () => {
                  sb.removeEventListener("updateend", ok);
                  sb.removeEventListener("error", no);
                  resolve();
                };
                const no = () => {
                  sb.removeEventListener("updateend", ok);
                  sb.removeEventListener("error", no);
                  reject(new Error("sourcebuffer append error"));
                };
                sb.addEventListener("updateend", ok);
                sb.addEventListener("error", no);
                // 拷进独立 ArrayBuffer（reader 的 Uint8Array 泛型不满足 appendBuffer 的 BufferSource）
                const buf = new ArrayBuffer(chunk.byteLength);
                new Uint8Array(buf).set(chunk);
                sb.appendBuffer(buf);
              });
            const reader = body.getReader();
            let gotFrame = false;
            for (;;) {
              const { done, value } = await reader.read();
              if (stopped) {
                firstReject(new Error("stopped")); // 首帧前已 resolve 时此为 no-op
                try {
                  await reader.cancel();
                } catch {
                  /* ignore */
                }
                return;
              }
              if (done) break;
              if (value) {
                await appendChunk(value);
                if (!gotFrame) {
                  gotFrame = true;
                  firstResolve(); // 首帧已可播 → fetchAudio 可以返回这个 audio 了
                }
              }
            }
            if (!gotFrame) {
              firstReject(new Error("empty stream"));
              return;
            }
            // 流结束收尾：duration 才定得下来、尾音才播得全
            if (!stopped && ms.readyState === "open") {
              if (sb.updating) {
                await new Promise((r) =>
                  sb.addEventListener("updateend", () => r(null), { once: true }),
                );
              }
              ms.endOfStream();
            }
          } catch (e) {
            // 首帧前失败 → 让 fetchAudio 返回 null 走回退；首帧后失败 → 尽量收尾让 onended 触发
            firstReject(e);
            if (!stopped && ms.readyState === "open") {
              try {
                ms.endOfStream();
              } catch {
                /* ignore */
              }
            }
          }
        })();

        try {
          await firstFrame;
        } catch {
          revoke(k);
          return null;
        }
        return a;
      } catch {
        return null;
      }
    })();
    audioCache[k] = p;
    return p;
  };

  // MSE 渐进播放期 duration 尚未定（要等 endOfStream），先按字数估总时长兜底高亮；
  // 收尾后 a.duration 变真实值自动校正。命中缓存(整段)则一开始就是真实 duration。
  const PER_TOKEN = lang.startsWith("zh") ? 0.2 : 0.32;
  const tick = (a: HTMLAudioElement, base: number, toks: string[]) => {
    if (stopped || a.paused || a.ended) {
      rafId = null;
      return;
    }
    if (opts.onWord && toks.length) {
      const dur =
        Number.isFinite(a.duration) && a.duration > 0 ? a.duration : toks.length * PER_TOKEN;
      const i = Math.min(toks.length - 1, Math.floor((a.currentTime / dur) * toks.length));
      opts.onWord(base + i, toks[i] ?? "");
    }
    rafId = requestAnimationFrame(() => tick(a, base, toks));
  };

  const advance = (k: number) => {
    if (stopped) return;
    if (paused) {
      pendingNext = k; // 段间暂停：记住续点
      return;
    }
    void playFrom(k);
  };

  // 云端失败 / 自动播放被拦时，该段回退整段 speakText（其内部再回退 Web Speech），播完续下一段。
  const fallbackChunk = (k: number) => {
    curAudio = null;
    curCtrl = speakText(chunks[k], {
      lang,
      rate: opts.rate,
      pitch: opts.pitch,
      voice: opts.voice,
      onWord: opts.onWord ? (i, w) => opts.onWord!(offsets[k] + i, w) : undefined,
      onEnd: () => {
        curCtrl = null;
        advance(k + 1);
      },
    });
  };

  async function playFrom(k: number) {
    if (stopped) return;
    if (k >= chunks.length) {
      opts.onEnd?.();
      return;
    }
    idx = k;
    pendingNext = null;
    const ap = fetchAudio(k);
    // 播当前段时并发预取下一段：流式端点首帧即返回(~0.6–1s)，预取 1 段足以藏住段间，
    // 同时把下一段在服务端合成并落缓存。深度保持 1 → 首听最多 2 路并发 WS，避开大模型并发限流。
    if (k + 1 < chunks.length) void fetchAudio(k + 1);
    const a = await ap;
    if (stopped) return;
    if (!a) {
      fallbackChunk(k);
      return;
    }
    curCtrl = null;
    curAudio = a;
    currentAudio = a; // 让 stopSpeaking / 其它来源能停掉本段
    const base = offsets[k];
    const toks = tokensPer[k];
    a.onended = () => {
      stopRaf();
      revoke(k);
      if (currentAudio === a) currentAudio = null;
      advance(k + 1);
    };
    a.onerror = () => {
      stopRaf();
      revoke(k);
      if (currentAudio === a) currentAudio = null;
      advance(k + 1);
    };
    a.onplay = () => {
      stopRaf();
      rafId = requestAnimationFrame(() => tick(a, base, toks));
    };
    if (!paused) {
      try {
        await a.play();
      } catch {
        if (stopped) return;
        if (currentAudio === a) currentAudio = null;
        fallbackChunk(k); // 自动播放被拦 → 回退（对自动播放更宽松）
      }
    }
  }

  stopSpeaking(); // 清掉其它正在播的
  void playFrom(0);

  return {
    pause() {
      paused = true;
      if (curCtrl) curCtrl.pause();
      else curAudio?.pause();
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (curCtrl) {
        curCtrl.resume();
        return;
      }
      if (curAudio && !curAudio.ended) {
        void curAudio.play().catch(() => {});
        return;
      }
      if (pendingNext !== null) {
        const n = pendingNext;
        pendingNext = null;
        void playFrom(n);
      } else {
        void playFrom(idx);
      }
    },
    stop() {
      stopped = true;
      stopRaf();
      try {
        ac.abort();
      } catch {
        /* ignore */
      }
      if (curCtrl) {
        curCtrl.stop();
        curCtrl = null;
      }
      if (curAudio) {
        curAudio.pause();
        if (currentAudio === curAudio) currentAudio = null;
        curAudio = null;
      }
      for (let i = 0; i < objUrls.length; i++) revoke(i); // 回收所有段的 objectURL
    },
  };
}

// ---------- STT 一句话识别（给 #5a 语音提问用） ----------
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

// 腾讯云一句话识别只认 [mp3,wav,pcm,m4a,speex,silk,aac,ogg-opus,amr]，
// 而浏览器 MediaRecorder 在 Chrome/Edge 只能出 webm/opus（容器不被接受）。
// 所以这里用 Web Audio 抓 16k 单声道 PCM，自己封 WAV，发 format=wav（16k_zh 引擎要 16k）。
const TARGET_RATE = 16000;

/** 把若干段 Float32 采样降到 16k 后封成 16-bit PCM WAV。 */
function encodeWav(buffers: Float32Array[], inRate: number): ArrayBuffer {
  const total = buffers.reduce((n, b) => n + b.length, 0);
  const merged = new Float32Array(total);
  let o = 0;
  for (const b of buffers) {
    merged.set(b, o);
    o += b.length;
  }
  // 降采样到 16k（多数浏览器已按请求出 16k，则比例为 1，等同直拷）
  const ratio = inRate / TARGET_RATE;
  const outLen = ratio > 1 ? Math.floor(merged.length / ratio) : merged.length;
  const samples = new Float32Array(outLen);
  if (ratio > 1) {
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.floor((i + 1) * ratio);
      let sum = 0;
      let c = 0;
      for (let j = start; j < end && j < merged.length; j++) {
        sum += merged[j];
        c++;
      }
      samples[i] = c ? sum / c : merged[start] ?? 0;
    }
  } else {
    samples.set(merged);
  }

  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // PCM 子块大小
  view.setUint16(20, 1, true); // 格式 = PCM
  view.setUint16(22, 1, true); // 单声道
  view.setUint32(24, TARGET_RATE, true);
  view.setUint32(28, TARGET_RATE * 2, true); // 字节率 = 采样率 * 块对齐
  view.setUint16(32, 2, true); // 块对齐 = 声道 * 每样本字节
  view.setUint16(34, 16, true); // 16 bit
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  let off = 44;
  for (let i = 0; i < samples.length; i++, off += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

/** 可控录音器：按下 start()、松手 stop() 取回 16k 单声道 WAV blob。给"按住说话"用。 */
export function createRecorder(): {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
} {
  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  let buffers: Float32Array[] = [];
  let inRate = TARGET_RATE;

  const teardown = () => {
    try {
      processor?.disconnect();
    } catch {
      /* ignore */
    }
    try {
      source?.disconnect();
    } catch {
      /* ignore */
    }
    stream?.getTracks().forEach((t) => t.stop());
    void ctx?.close();
    processor = null;
    source = null;
    ctx = null;
    stream = null;
  };

  return {
    async start() {
      buffers = [];
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      ctx = new AudioContext({ sampleRate: TARGET_RATE });
      inRate = ctx.sampleRate; // 浏览器可能忽略请求的采样率，记真实值用于降采样
      source = ctx.createMediaStreamSource(stream);
      processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        buffers.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(processor);
      // 接到 destination 才会持续触发 onaudioprocess；我们不写输出，故是静音、无回授
      processor.connect(ctx.destination);
    },
    stop() {
      return new Promise<Blob>((resolve) => {
        const collected = buffers;
        const rate = inRate;
        teardown();
        resolve(new Blob([encodeWav(collected, rate)], { type: "audio/wav" }));
      });
    },
    cancel() {
      buffers = [];
      teardown();
    },
  };
}

/** 把一段录音 blob 送服务端「一句话识别」转文字。默认 wav（createRecorder 产出 16k WAV）。 */
export async function recognizeBlob(
  blob: Blob,
  opts: { lang?: string; format?: string } = {},
): Promise<string> {
  const audioBase64 = arrayBufferToBase64(await blob.arrayBuffer());
  const res = await fetch("/api/speech/stt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      audioBase64,
      lang: opts.lang ?? "zh-CN",
      format: opts.format ?? "wav",
    }),
  });
  if (!res.ok) return "";
  const { text } = await res.json();
  return (text as string) ?? "";
}

/**
 * 录固定时长一句话并识别成文字。需浏览器麦克风权限 + 服务端已开通语音识别。
 * 复用 createRecorder（16k 单声道 WAV，腾讯云一句话识别可直接接受）。
 */
export async function recognizeOnce(
  opts: { lang?: string; maxMs?: number } = {},
): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "";
  const rec = createRecorder();
  await rec.start();
  await new Promise((resolve) => setTimeout(resolve, opts.maxMs ?? 6000));
  const blob = await rec.stop();
  return recognizeBlob(blob, { lang: opts.lang ?? "zh-CN", format: "wav" });
}
