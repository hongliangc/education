// 语音封装：朗读优先走腾讯云大模型 TTS（真实童声），失败优雅回退 Web Speech；
// STT 走云端「一句话识别」。对外导出签名保持稳定，games / StoryReader 仅需用新的 controller。
"use client";

import { DEFAULT_VOICE_ZH, DEFAULT_VOICE_EN } from "./speech/voices";

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
          if (!userPaused) await a.play().catch(() => {});
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

/** 可控录音器：按下 start()、松手 stop() 取回 blob。给"按住说话"用。 */
export function createRecorder(): {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
  cancel: () => void;
} {
  let rec: MediaRecorder | null = null;
  let stream: MediaStream | null = null;
  const chunks: BlobPart[] = [];
  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.start();
    },
    stop() {
      return new Promise<Blob>((resolve) => {
        const finish = () => {
          stream?.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: "audio/webm" }));
        };
        if (rec && rec.state !== "inactive") {
          rec.onstop = finish;
          rec.stop();
        } else {
          finish();
        }
      });
    },
    cancel() {
      try {
        if (rec && rec.state !== "inactive") rec.stop();
      } catch {
        /* ignore */
      }
      stream?.getTracks().forEach((t) => t.stop());
    },
  };
}

/** 把一段录音 blob 送服务端「一句话识别」转文字。format 默认 webm（联调期按需改 wav/pcm）。 */
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
      format: opts.format ?? "webm",
    }),
  });
  if (!res.ok) return "";
  const { text } = await res.json();
  return (text as string) ?? "";
}

/**
 * 录一句话并识别成文字。需浏览器麦克风权限 + 服务端已开通语音识别。
 * 注意：MediaRecorder 默认产出 webm/opus，腾讯云一句话识别对 webm 容器支持有限，
 * #5a 联调时若识别为空，改用 wav/pcm 编码并相应传 format（已知不确定点）。
 */
export async function recognizeOnce(
  opts: { lang?: string; maxMs?: number } = {},
): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return "";
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks: BlobPart[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const stopped = new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
  });
  rec.start();
  setTimeout(() => {
    if (rec.state !== "inactive") rec.stop();
  }, opts.maxMs ?? 6000);
  await stopped;
  stream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: "audio/webm" });
  return recognizeBlob(blob, { lang: opts.lang ?? "zh-CN", format: "webm" });
}
