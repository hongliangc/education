// 语音封装：朗读优先走腾讯云大模型 TTS（真实童声），失败优雅回退 Web Speech；
// STT 走云端「一句话识别」。对外导出签名保持不变，games / StoryReader 无需改动。
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

// ---------- 逐词高亮（定时模拟，Task 8 将换成字级时间戳） ----------
function startTimerHighlight(text: string, opts: SpeakOptions): () => void {
  if (!opts.onWord) return () => undefined;
  const lang = opts.lang ?? "zh-CN";
  const rate = opts.rate ?? 1;
  const tokens = lang.startsWith("zh")
    ? Array.from(text)
    : text.split(/(\s+|[.,!?；。！？])/).filter((s) => s.trim().length);
  let idx = 0;
  const perChar = lang.startsWith("zh") ? 230 : 280;
  const intervalMs = Math.max(80, perChar / rate);
  const timer = setInterval(() => {
    if (idx < tokens.length) {
      opts.onWord?.(idx, tokens[idx]);
      idx++;
    } else {
      clearInterval(timer);
    }
  }, intervalMs);
  return () => clearInterval(timer);
}

// ---------- Web Speech 回退实现 ----------
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

async function speakViaWebSpeech(text: string, opts: SpeakOptions): Promise<() => void> {
  if (!isSpeechSupported()) {
    opts.onEnd?.();
    return () => undefined;
  }
  await ensureVoicesLoaded();

  const lang = opts.lang ?? "zh-CN";
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = opts.rate ?? 1;
  utter.pitch = opts.pitch ?? 1.05;
  const v = pickVoice(lang);
  if (v) utter.voice = v;

  const stopHighlight = startTimerHighlight(text, opts);
  utter.onend = () => {
    stopHighlight();
    opts.onEnd?.();
  };
  utter.onerror = () => {
    stopHighlight();
    opts.onEnd?.();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);

  return () => {
    stopHighlight();
    window.speechSynthesis.cancel();
  };
}

// ---------- 云 TTS 主路径 ----------
let currentAudio: HTMLAudioElement | null = null;
// 本会话一旦探测到云 TTS 不可用（未配置/网络错误），后续直接回退，避免每次朗读都先卡一下。
let cloudTtsUnavailable = false;

export async function speakText(text: string, opts: SpeakOptions = {}): Promise<() => void> {
  const lang = opts.lang ?? "zh-CN";

  if (!cloudTtsUnavailable) {
    try {
      const res = await fetch("/api/speech/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang, voice: resolveVoice(lang, opts.voice) }),
      });
      if (res.ok) {
        const { audioBase64, format } = await res.json();
        stopSpeaking();
        const audio = new Audio(`data:audio/${format};base64,${audioBase64}`);
        currentAudio = audio;
        const stopHighlight = startTimerHighlight(text, opts);
        const finish = () => {
          stopHighlight();
          if (currentAudio === audio) currentAudio = null;
          opts.onEnd?.();
        };
        audio.onended = finish;
        audio.onerror = finish;
        await audio.play().catch(() => {});
        return () => {
          stopHighlight();
          audio.pause();
          if (currentAudio === audio) currentAudio = null;
        };
      }
      // 503 = 服务端未配置密钥 → 整会话回退
      if (res.status === 503) cloudTtsUnavailable = true;
    } catch {
      cloudTtsUnavailable = true; // 网络/解析错误 → 回退
    }
  }

  return speakViaWebSpeech(text, opts);
}

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

/**
 * 录一句话并识别成文字。需浏览器麦克风权限 + 服务端已开通语音识别。
 * 注意：MediaRecorder 默认产出 webm/opus，腾讯云一句话识别对 webm 容器支持有限，
 * #5a 联调时若识别为空，改用 wav/pcm 编码并相应传 format（Task 7 的已知不确定点）。
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
  const audioBase64 = arrayBufferToBase64(await blob.arrayBuffer());
  const res = await fetch("/api/speech/stt", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ audioBase64, lang: opts.lang ?? "zh-CN", format: "webm" }),
  });
  if (!res.ok) return "";
  const { text } = await res.json();
  return (text as string) ?? "";
}
