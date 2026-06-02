"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useBgm } from "@/components/audio/useBgm";
import { useSFX } from "@/components/audio/useSFX";
import { speakChunks, speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { subtitleLines } from "@/lib/speech/subtitle";
import { IllustrationStage } from "./IllustrationStage";
import { SubtitleLine } from "./SubtitleLine";

const RATES = [
  { label: "🐢 0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "🐰 1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "⚡ 1.5x", value: 1.5 },
];

export function StoryPlayer({
  text,
  images,
  onFinish,
  cover,
  fallbackEmoji = "📖",
}: {
  text: string;
  images: string[];
  onFinish: () => void;
  cover?: string;
  fallbackEmoji?: string;
}) {
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [charIndex, setCharIndex] = useState(-1);
  const { enabled: bgmOn, toggle: toggleBgm } = useBgm();
  const { sfx } = useSFX();
  const ctrlRef = useRef<SpeechController | null>(null);

  const chars = useMemo(() => Array.from(text), [text]);
  const lines = useMemo(() => subtitleLines(text), [text]);
  const totalChars = chars.length;
  const progress = charIndex < 0 || totalChars === 0 ? 0 : (charIndex + 1) / totalChars;
  const imgIndex =
    images.length > 0 ? Math.min(images.length - 1, Math.floor(progress * images.length)) : -1;

  useEffect(() => {
    return () => {
      ctrlRef.current?.stop();
      ctrlRef.current = null;
      stopSpeaking();
    };
  }, []);

  const startReading = () => {
    ctrlRef.current?.stop();
    sfx.pageFlip();
    setStatus("playing");
    setCharIndex(0);
    ctrlRef.current = speakChunks(text, {
      lang: "zh-CN",
      rate,
      onWord: (index) => setCharIndex(index),
      onEnd: () => {
        ctrlRef.current = null;
        setStatus("idle");
        setCharIndex(-1);
      },
    });
  };

  const togglePlay = () => {
    if (status === "playing") {
      ctrlRef.current?.pause();
      setStatus("paused");
      return;
    }

    if (status === "paused") {
      ctrlRef.current?.resume();
      setStatus("playing");
      return;
    }

    startReading();
  };

  const speakChar = (globalIndex: number) => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setStatus("idle");
    setCharIndex(globalIndex);
    speakText(chars[globalIndex] ?? "", { lang: "zh-CN", rate });
  };

  return (
    <div>
      <IllustrationStage
        images={images}
        imgIndex={imgIndex}
        fallbackEmoji={fallbackEmoji}
        cover={cover}
      />

      <div className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
        <SubtitleLine text={text} lines={lines} charIndex={charIndex} onCharClick={speakChar} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Btn
          onClick={togglePlay}
          variant="primary"
          size="md"
          ariaLabel={status === "playing" ? "暂停朗读" : "朗读故事"}
        >
          {status === "playing" ? "⏸ 暂停" : status === "paused" ? "▶ 继续" : "▶ 听故事"}
        </Btn>

        <div className="flex items-center gap-1 rounded-2xl bg-white px-2 py-1 ring-1 ring-slate-200">
          {RATES.map((option) => (
            <button
              key={option.value}
              onClick={() => setRate(option.value)}
              className={`rounded-xl px-2 py-1 text-sm ${
                rate === option.value ? "bg-pink-400 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-label={`语速 ${option.value}x`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          onClick={toggleBgm}
          className="rounded-2xl bg-white px-3 py-2 text-lg ring-1 ring-slate-200 hover:bg-slate-100"
          aria-label={bgmOn ? "关闭背景音乐" : "打开背景音乐"}
          title={bgmOn ? "背景音乐：开" : "背景音乐：关"}
        >
          {bgmOn ? "🔊" : "🔇"}
        </button>

        <Btn
          variant="secondary"
          onClick={() => {
            ctrlRef.current?.stop();
            ctrlRef.current = null;
            setStatus("idle");
            onFinish();
          }}
        >
          读完了，回答问题 →
        </Btn>
      </div>

      <p className="mt-2 text-center text-xs text-slate-400">
        小提示：点字幕里的字可以单独听它的读音
      </p>
    </div>
  );
}
