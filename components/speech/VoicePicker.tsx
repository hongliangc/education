"use client";

import { useEffect, useState } from "react";
import { TTS_VOICES } from "@/lib/speech/voices";
import { getVoicePref, setVoicePref, speakText, stopSpeaking } from "@/lib/speech";

const SAMPLE_ZH = "你好呀，我是你的学习精灵，我们一起加油吧！";
const SAMPLE_EN = "Hi! I'm your learning fairy. Let's go!";

export function VoicePicker({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<number>(() => getVoicePref() ?? TTS_VOICES[0].id);
  const [previewing, setPreviewing] = useState<number | null>(null);

  // 关闭时停止任何正在播放的试听
  useEffect(() => () => stopSpeaking(), []);

  function choose(id: number) {
    setSelected(id);
    setVoicePref(id);
  }

  async function preview(id: number) {
    stopSpeaking();
    setPreviewing(id);
    const voice = TTS_VOICES.find((v) => v.id === id);
    const isEn = voice?.lang === "en";
    await speakText(isEn ? SAMPLE_EN : SAMPLE_ZH, {
      voice: id,
      lang: isEn ? "en-US" : "zh-CN",
      onEnd: () => setPreviewing((p) => (p === id ? null : p)),
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="选择精灵声音"
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-700">🔊 选择精灵声音</h2>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500 hover:bg-slate-200"
          >
            完成
          </button>
        </div>

        <ul className="space-y-2">
          {TTS_VOICES.map((v) => (
            <li
              key={v.id}
              className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition ${
                selected === v.id ? "border-violet-400 bg-violet-50" : "border-slate-100"
              }`}
            >
              <button onClick={() => choose(v.id)} className="flex-1 text-left">
                <div className="font-bold text-slate-700">
                  {v.name}
                  {selected === v.id && <span className="ml-1 text-violet-500">✓</span>}
                </div>
                <div className="text-xs text-slate-400">{v.desc}</div>
              </button>
              <button
                onClick={() => preview(v.id)}
                aria-label={`试听 ${v.name}`}
                className="shrink-0 rounded-full bg-amber-100 px-3 py-2 text-sm font-bold text-amber-600 hover:bg-amber-200"
              >
                {previewing === v.id ? "🔊 …" : "▶️ 试听"}
              </button>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          选好后，故事朗读和精灵说话都会用这个声音
        </p>
      </div>
    </div>
  );
}
