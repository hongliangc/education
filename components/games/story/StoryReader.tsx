"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText, stopSpeaking } from "@/lib/speech";
import type { Story } from "@/content/stories";

const RATES = [
  { label: "🐢 0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "🐰 1x", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "⚡ 1.5x", value: 1.5 },
];

export function StoryReader({
  story,
  onFinish,
}: {
  story: Story;
  onFinish: () => void;
}) {
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const { sfx } = useSFX();
  const stopRef = useRef<(() => void) | null>(null);

  const chars = Array.from(story.text);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopRef.current?.();
    };
  }, []);

  const play = async () => {
    if (playing) {
      stopRef.current?.();
      setPlaying(false);
      setHighlight(-1);
      return;
    }
    sfx.pageFlip();
    setPlaying(true);
    setHighlight(0);
    const stop = await speakText(story.text, {
      lang: "zh-CN",
      rate,
      onWord: (i) => setHighlight(i),
      onEnd: () => {
        setPlaying(false);
        setHighlight(-1);
      },
    });
    stopRef.current = stop;
  };

  return (
    <div>
      <div className="rounded-2xl bg-amber-50 p-5 leading-loose text-lg text-slate-700 ring-1 ring-amber-100 anim-pop-in">
        {chars.map((c, i) => (
          <span
            key={i}
            onClick={() => {
              stopSpeaking();
              setHighlight(i);
              speakText(c, { lang: "zh-CN", rate });
            }}
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
          onClick={play}
          variant="primary"
          size="md"
          ariaLabel={playing ? "暂停朗读" : "朗读故事"}
        >
          {playing ? "⏸ 暂停" : "▶ 听故事"}
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
            stopSpeaking();
            setPlaying(false);
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
