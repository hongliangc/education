"use client";

import { useEffect, useRef, useState } from "react";
import {
  speakText,
  speakEnglish,
  stopSpeaking,
  createRecorder,
  recognizeBlob,
  type SpeechController,
} from "@/lib/speech";
import { createHoldToTalkSession } from "@/components/fairy/holdToTalk";
import { useRecordingAudioGuard } from "@/components/fairy/useRecordingAudioGuard";

type Phase = "idle" | "listening" | "thinking";

// Reusable "listen, then say it" control for the speaking steps (design §4). The 🔊 button reads the
// target aloud (cloud child-voice TTS → Web Speech fallback). The 🎤 button is press-and-hold: it
// records, recognizes (en-US) and reports the transcript via onSpoken (empty string = nothing heard,
// which the encourage-first caller treats as a miss). If the mic is blocked, it degrades to a
// "👍 我说好了" self-confirm — onSpoken(null) — so a young child is never stuck on this step.
export function SpeakPanel({
  say,
  lang = "en-US",
  disabled,
  onSpoken,
  onListen,
}: {
  say: string;
  lang?: string;
  disabled?: boolean;
  onSpoken: (transcript: string | null) => void;
  // 「🔊 听一遍」播放什么由调用方决定（字母=名→音→词三段；音标=单独示范音素）；
  // 不传则回退到直接读 say。🎤 跟读始终以 say 作为识别目标。
  onListen?: () => SpeechController;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [micBlocked, setMicBlocked] = useState(false);
  const holdRef = useRef<ReturnType<typeof createHoldToTalkSession> | null>(null);
  const speakRef = useRef<SpeechController | null>(null);
  const guard = useRecordingAudioGuard();
  holdRef.current ??= createHoldToTalkSession(createRecorder);

  useEffect(() => {
    return () => {
      holdRef.current?.cancel();
      speakRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  const listen = () => {
    speakRef.current?.stop();
    speakRef.current = onListen
      ? onListen()
      : lang.startsWith("en")
        ? speakEnglish(say, { rate: 0.85 })
        : speakText(say, { lang, rate: 0.85 });
  };

  const press = async () => {
    if (disabled || phase !== "idle" || micBlocked) return;
    speakRef.current?.stop();
    stopSpeaking();
    guard.interrupt();
    try {
      const ready = await holdRef.current!.begin();
      if (!ready) return;
      setPhase("listening");
    } catch {
      guard.restore();
      setMicBlocked(true); // no mic permission → fall back to self-confirm
      setPhase("idle");
    }
  };

  const release = async () => {
    if (phase !== "listening") return;
    setPhase("thinking");
    try {
      const blob = await holdRef.current!.end();
      if (!blob) {
        setPhase("idle");
        return;
      }
      const text = await recognizeBlob(blob, { lang, format: "wav" });
      onSpoken(text);
    } catch {
      onSpoken(""); // recognition unavailable → a miss; encourage-first will retry then soft-pass
    } finally {
      guard.restore();
      setPhase("idle");
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={listen}
        disabled={disabled || phase === "listening"}
        className="rounded-full bg-sky-100 px-4 py-2 text-base font-bold text-sky-600 ring-2 ring-sky-200 transition hover:bg-sky-200 disabled:opacity-50"
        aria-label="听一遍"
      >
        🔊 听一遍
      </button>

      {micBlocked ? (
        <button
          type="button"
          onClick={() => !disabled && onSpoken(null)}
          disabled={disabled}
          className="rounded-full bg-emerald-500 px-6 py-3 text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50"
          aria-label="我说好了"
        >
          👍 我说好了
        </button>
      ) : (
        <button
          type="button"
          onPointerDown={press}
          onPointerUp={release}
          onPointerLeave={release}
          disabled={disabled || phase === "thinking"}
          className={`h-16 w-48 touch-none select-none rounded-full text-lg font-bold text-white shadow-lg transition active:scale-95 disabled:opacity-50 ${
            phase === "listening" ? "animate-pulse bg-rose-500" : "bg-pink-500"
          }`}
          aria-label="按住跟读"
        >
          🎤 {phase === "listening" ? "松开" : phase === "thinking" ? "听一听…" : "按住跟读"}
        </button>
      )}
    </div>
  );
}
