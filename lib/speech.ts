// Web Speech API 封装：TTS + 简易逐词高亮
"use client";

export interface SpeakOptions {
  lang?: string;
  rate?: number;
  pitch?: number;
  onWord?: (index: number, word: string) => void;
  onEnd?: () => void;
}

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

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function speakText(text: string, opts: SpeakOptions = {}): Promise<() => void> {
  if (!isSpeechSupported()) {
    opts.onEnd?.();
    return () => undefined;
  }
  await ensureVoicesLoaded();

  const lang = opts.lang ?? "zh-CN";
  const rate = opts.rate ?? 1;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = rate;
  utter.pitch = opts.pitch ?? 1.05;
  const v = pickVoice(lang);
  if (v) utter.voice = v;

  // 逐词高亮：中文按字，英文按 token 分。SpeechSynthesisUtterance.onboundary 在大多数中文 TTS 上不触发，所以定时模拟。
  let timer: ReturnType<typeof setInterval> | null = null;
  if (opts.onWord) {
    const tokens = lang.startsWith("zh")
      ? Array.from(text)
      : text.split(/(\s+|[.,!?；。！？])/).filter((s) => s.trim().length);
    let idx = 0;
    const perChar = lang.startsWith("zh") ? 230 : 280;
    const intervalMs = Math.max(80, perChar / rate);
    timer = setInterval(() => {
      if (idx < tokens.length) {
        opts.onWord?.(idx, tokens[idx]);
        idx++;
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }, intervalMs);
  }

  utter.onend = () => {
    if (timer) clearInterval(timer);
    opts.onEnd?.();
  };
  utter.onerror = () => {
    if (timer) clearInterval(timer);
    opts.onEnd?.();
  };

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);

  return () => {
    if (timer) clearInterval(timer);
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}
