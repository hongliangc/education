"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText, speakChunks, stopSpeaking, type SpeechController } from "@/lib/speech";

const RATES = [
  { label: "🐢 0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "🐰 1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "⚡ 1.5x", value: 1.5 },
];

export function StoryReader({
  text,
  onFinish,
}: {
  text: string;
  onFinish: () => void;
}) {
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<"idle" | "playing" | "paused">("idle");
  const [highlight, setHighlight] = useState<number>(-1);
  const { sfx } = useSFX();
  const ctrlRef = useRef<SpeechController | null>(null);

  const chars = Array.from(text);

  useEffect(() => {
    return () => {
      ctrlRef.current?.stop();
      ctrlRef.current = null;
      stopSpeaking();
    };
  }, []);

  // 从头开始朗读整篇故事
  const startReading = () => {
    ctrlRef.current?.stop();
    sfx.pageFlip();
    setStatus("playing");
    setHighlight(0);
    // 整章朗读按句分段、依次走云端 REST TTS：每段 ≤150 字（不触发长度上限 → 稳定真实童声），
    // 且每段独立命中服务端缓存（重听不再合成、不再扣字符额度）。逐字高亮按全局字符索引推进。
    ctrlRef.current = speakChunks(text, {
      lang: "zh-CN",
      rate,
      onWord: (i) => setHighlight(i),
      onEnd: () => {
        ctrlRef.current = null;
        setStatus("idle");
        setHighlight(-1);
      },
    });
  };

  // 播放按钮：idle→开始，playing→暂停，paused→从原处继续
  const togglePlay = () => {
    if (status === "playing") {
      ctrlRef.current?.pause();
      setStatus("paused");
    } else if (status === "paused") {
      ctrlRef.current?.resume();
      setStatus("playing");
    } else {
      startReading();
    }
  };

  // 单字点读：停掉整篇朗读，单独读这个字
  const speakChar = (i: number, c: string) => {
    ctrlRef.current?.stop();
    ctrlRef.current = null;
    setStatus("idle");
    setHighlight(i);
    speakText(c, { lang: "zh-CN", rate });
  };

  return (
    <div>
      <div className="rounded-2xl bg-amber-50 p-5 leading-loose text-lg text-slate-700 ring-1 ring-amber-100 anim-pop-in">
        {chars.map((c, i) => (
          <span
            key={i}
            onClick={() => speakChar(i, c)}
            className={`cursor-pointer transition ${
              i === highlight
                ? "bg-amber-200 text-amber-900 rounded px-0.5"
                : "hover:bg-amber-100/60"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
        <Btn
          onClick={togglePlay}
          variant="primary"
          size="md"
          ariaLabel={status === "playing" ? "暂停朗读" : "朗读故事"}
        >
          {status === "playing"
            ? "⏸ 暂停"
            : status === "paused"
            ? "▶ 继续"
            : "▶ 听故事"}
        </Btn>
        <div className="flex items-center gap-1 bg-white rounded-2xl px-2 py-1 ring-1 ring-slate-200">
          {RATES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRate(r.value)}
              className={`text-sm px-2 py-1 rounded-xl ${
                rate === r.value
                  ? "bg-pink-400 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
              aria-label={`语速 ${r.value}x`}
            >
              {r.label}
            </button>
          ))}
        </div>
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

      <p className="mt-2 text-xs text-center text-slate-400">
        小提示：点击任何一个字可以单独朗读它
      </p>
    </div>
  );
}
