"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText } from "@/lib/speech";
import { CHARS } from "@/content/chars";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

const ROUND_CHARS = 4;

export function WritingGame({ onComplete }: { onComplete: OnComplete }) {
  const [round] = useState(() => CHARS.slice(0, ROUND_CHARS));
  const [idx, setIdx] = useState(0);
  const [doneInRound, setDoneInRound] = useState(0);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());

  const item = round[idx];

  useEffect(() => {
    if (!item) return;
    drawGuide(canvasRef.current, item.char);
    speakText(item.char, { lang: "zh-CN" });
  }, [item]);

  if (done) {
    const stars = Math.min(3, doneInRound);
    return (
      <GameDone
        starsEarned={Math.max(1, stars)}
        correctQ={doneInRound}
        totalQ={round.length}
        onAgain={() => {
          setIdx(0);
          setDoneInRound(0);
          setDone(false);
          startedAt.current = Date.now();
          drawGuide(canvasRef.current, round[0].char);
        }}
        onClose={() => undefined}
      />
    );
  }

  const startStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = ptOnCanvas(e, c);
  };
  const drawStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c || !last.current) return;
    const cur = ptOnCanvas(e, c);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    last.current = cur;
  };
  const endStroke = () => {
    drawing.current = false;
    last.current = null;
  };

  const next = () => {
    sfx.coin();
    setDoneInRound((d) => d + 1);
    if (idx + 1 >= round.length) {
      const correct = doneInRound + 1;
      const stars = correct >= round.length ? 3 : correct >= round.length - 1 ? 2 : 1;
      onComplete({
        score: correct * 25,
        totalQ: round.length,
        correctQ: correct,
        durationSec: Math.round((Date.now() - startedAt.current) / 1000),
        starsEarned: stars,
      });
      setDone(true);
    } else {
      setIdx((i) => i + 1);
    }
  };

  const clearCanvas = () => {
    drawGuide(canvasRef.current, item.char);
    sfx.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-full text-center anim-pop-in">
        <div className="text-4xl">{item.pinyin}</div>
        <div className="text-sm text-slate-500">{item.meaning} · {item.hint}</div>
        <button
          onClick={() => speakText(item.char, { lang: "zh-CN" })}
          aria-label={`朗读 ${item.char}`}
          className="mt-1 text-sm text-pink-600 underline"
        >
          🔊 听这个字
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={320}
        height={320}
        onPointerDown={startStroke}
        onPointerMove={drawStroke}
        onPointerUp={endStroke}
        onPointerCancel={endStroke}
        className="mt-4 touch-none rounded-2xl bg-white shadow-inner ring-2 ring-pink-200"
        style={{ width: "min(320px, 90vw)", height: "min(320px, 90vw)" }}
      />

      <div className="mt-4 flex gap-3">
        <Btn variant="ghost" onClick={clearCanvas} ariaLabel="清空重写">
          🧽 清空重写
        </Btn>
        <Btn variant="primary" onClick={next} ariaLabel="完成此字">
          写好了 ✓
        </Btn>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        第 {idx + 1} 个字 / 共 {round.length} 个
      </p>
    </div>
  );
}

function ptOnCanvas(e: React.PointerEvent<HTMLCanvasElement>, c: HTMLCanvasElement) {
  const rect = c.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * c.width,
    y: ((e.clientY - rect.top) / rect.height) * c.height,
  };
}

function drawGuide(c: HTMLCanvasElement | null, ch: string) {
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);
  // 米字格
  ctx.strokeStyle = "#fbcfe8";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(c.width / 2, 0);
  ctx.lineTo(c.width / 2, c.height);
  ctx.moveTo(0, c.height / 2);
  ctx.lineTo(c.width, c.height / 2);
  ctx.moveTo(0, 0);
  ctx.lineTo(c.width, c.height);
  ctx.moveTo(c.width, 0);
  ctx.lineTo(0, c.height);
  ctx.stroke();
  ctx.setLineDash([]);
  // 浅色描红样字
  ctx.fillStyle = "#fce7f3";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${c.width * 0.78}px "ZCOOL KuaiLe", "PingFang SC", serif`;
  ctx.fillText(ch, c.width / 2, c.height / 2 + 12);
}
