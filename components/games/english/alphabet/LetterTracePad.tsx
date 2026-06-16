"use client";

import { useEffect, useRef } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakSequence, type SpeechController } from "@/lib/speech";
import type { AlphabetEntry } from "@/content/english/alphabet";

// 字母描红手写板：四线三格 + 浅蓝色样字，孩子用手指/鼠标沿着描。沿用 WritingGame 的指针捕获画线手法，
// 但把汉字米字格换成英文四线格，并把样字定位在基线上（大写占顶格到基线，小写占中格、降部到底格）。
const W = 560;
const H = 240;

export function LetterTracePad({ entry }: { entry: AlphabetEntry }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(() => {
    drawGuide(canvasRef.current, entry);
  }, [entry]);

  useEffect(() => () => speechRef.current?.stop(), []);

  const listen = () => {
    speechRef.current?.stop();
    speechRef.current = speakSequence(
      [
        { text: entry.name, rate: 0.85 },
        { text: entry.word, rate: 0.85 },
      ],
      { lang: "en-US", gapMs: 340 },
    );
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pt(e, c);
  };
  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c || !last.current) return;
    const cur = pt(e, c);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#2563eb";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(cur.x, cur.y);
    ctx.stroke();
    last.current = cur;
  };
  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  const clear = () => {
    drawGuide(canvasRef.current, entry);
    sfx.click();
  };

  return (
    <div className="flex flex-col items-center">
      <p className="text-center text-sm font-bold text-slate-500">
        沿着浅色字母描一描，写出{" "}
        <span className="font-black text-blue-600">
          {entry.letter}
          {entry.lower}
        </span>
        （{entry.word} {entry.emoji}）
      </p>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        className="mt-3 touch-none rounded-2xl bg-white shadow-inner ring-2 ring-blue-200"
        style={{ width: `min(${W}px, 92vw)`, height: "auto", aspectRatio: `${W} / ${H}` }}
      />
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Btn variant="secondary" onClick={listen} ariaLabel="听字母">
          🔊 听一遍
        </Btn>
        <Btn variant="ghost" onClick={clear} ariaLabel="清空重写">
          🧽 清空重写
        </Btn>
      </div>
    </div>
  );
}

function pt(e: React.PointerEvent<HTMLCanvasElement>, c: HTMLCanvasElement) {
  const rect = c.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * c.width,
    y: ((e.clientY - rect.top) / rect.height) * c.height,
  };
}

function drawGuide(c: HTMLCanvasElement | null, entry: AlphabetEntry) {
  if (!c) return;
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, c.width, c.height);

  // 四线三格：顶线 / 中线(虚) / 基线 / 底线
  const top = c.height * 0.12;
  const step = (c.height * 0.8) / 3;
  const lines = [top, top + step, top + step * 2, top + step * 3];
  const baseline = lines[2];
  lines.forEach((y, i) => {
    ctx.beginPath();
    ctx.lineWidth = i === 0 || i === 3 ? 2 : 1.5;
    ctx.strokeStyle = i === 2 ? "#93c5fd" : "#bfdbfe"; // 基线略深
    ctx.setLineDash(i === 1 ? [8, 8] : []);
    ctx.moveTo(c.width * 0.04, y);
    ctx.lineTo(c.width * 0.96, y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // 浅色样字：基线对齐第三条线，大写到顶格、小写中格+降部到底格
  const fontPx = (baseline - top) / 0.72;
  ctx.fillStyle = "#dbeafe";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.font = `bold ${fontPx}px "Comic Sans MS", "Trebuchet MS", system-ui, sans-serif`;
  ctx.fillText(entry.letter, c.width * 0.38, baseline);
  ctx.fillText(entry.lower, c.width * 0.62, baseline);
}
