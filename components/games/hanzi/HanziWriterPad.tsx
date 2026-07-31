"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { HanziWriterInstance } from "hanzi-writer";
import type { HanziItem } from "@/content/hanzi";
import { runDemoThenPractice, type PracticeWriter } from "./writerFlow";
import { applyStrokeStyle, pointOnCanvas, redrawCanvas, type Point } from "./writingCanvas";

export function HanziWriterPad({
  item,
  demoRequest,
  onStrokeCorrect,
}: {
  item: HanziItem;
  demoRequest: number;
  onStrokeCorrect: () => void;
}) {
  const rawId = useId();
  const idBase = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const outlineTargetId = `hanzi-outline-${idBase}`;
  const demoTargetId = `hanzi-demo-${idBase}`;
  const outlineWriterRef = useRef<HanziWriterInstance | null>(null);
  const demoWriterRef = useRef<HanziWriterInstance | null>(null);
  const demoRef = useRef<(() => Promise<void>) | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<Point[]>([]);
  const strokesRef = useRef<Point[][]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const outlineElement = document.getElementById(outlineTargetId);
    const demoElement = document.getElementById(demoTargetId);
    if (!outlineElement || !demoElement) return;
    outlineElement.innerHTML = "";
    demoElement.innerHTML = "";
    setLoading(true);
    setFailed(false);
    demoRef.current = null;

    void import("hanzi-writer")
      .then(({ default: HanziWriter }) => {
        if (cancelled) return;
        const baseOptions = {
          width: 300,
          height: 300,
          padding: 12,
          charDataLoader: (char: string) =>
            fetch(`/hanzi-data/${encodeURIComponent(char)}.json`).then((res) => {
              if (!res.ok) throw new Error(`Missing stroke data for ${char}`);
              return res.json() as Promise<unknown>;
            }),
          onLoadCharDataError: () => {
            if (!cancelled) setFailed(true);
          },
        };
        const outlineWriter = HanziWriter.create(outlineElement, item.char, {
          ...baseOptions,
          showCharacter: false,
          showOutline: true,
          outlineColor: "#f9a8d4",
          strokeColor: "#f9a8d4",
        });
        const demoWriter = HanziWriter.create(demoElement, item.char, {
          ...baseOptions,
          showCharacter: false,
          showOutline: false,
          strokeAnimationSpeed: 1.2,
          delayBetweenStrokes: 180,
          strokeColor: "#334155",
          highlightColor: "#38bdf8",
        });
        outlineWriterRef.current = outlineWriter;
        demoWriterRef.current = demoWriter;
        const runDemo = async () => {
          await runDemoThenPractice(demoWriter as PracticeWriter);
        };
        demoRef.current = runDemo;
        setLoading(false);
        void runDemo().catch(() => undefined);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      outlineWriterRef.current?.cancelQuiz();
      demoWriterRef.current?.cancelQuiz();
      outlineWriterRef.current = null;
      demoWriterRef.current = null;
      demoRef.current = null;
      outlineElement.innerHTML = "";
      demoElement.innerHTML = "";
    };
  }, [demoTargetId, item.char, outlineTargetId]);

  useEffect(() => {
    if (demoRequest <= 0) return;
    void demoRef.current?.();
  }, [demoRequest]);

  useEffect(() => {
    strokesRef.current = [];
    setStrokeCount(0);
    redrawCanvas(canvasRef.current, strokesRef.current);
  }, [item.char]);

  const startStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const start = pointOnCanvas(e, canvas);
    currentStroke.current = [start];
  };

  const drawStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const stroke = currentStroke.current;
    if (!canvas || stroke.length === 0) return;
    const current = pointOnCanvas(e, canvas);
    const previous = stroke[stroke.length - 1];
    stroke.push(current);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    applyStrokeStyle(ctx);
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
  };

  const endStroke = () => {
    if (drawing.current && currentStroke.current.length > 1) {
      strokesRef.current = [...strokesRef.current, currentStroke.current];
      setStrokeCount(strokesRef.current.length);
      redrawCanvas(canvasRef.current, strokesRef.current);
      onStrokeCorrect();
    }
    drawing.current = false;
    currentStroke.current = [];
  };

  const clearPractice = () => {
    currentStroke.current = [];
    drawing.current = false;
    strokesRef.current = [];
    setStrokeCount(0);
    redrawCanvas(canvasRef.current, strokesRef.current);
  };

  const undoPractice = () => {
    currentStroke.current = [];
    drawing.current = false;
    strokesRef.current = strokesRef.current.slice(0, -1);
    setStrokeCount(strokesRef.current.length);
    redrawCanvas(canvasRef.current, strokesRef.current);
  };

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-square w-full max-w-[32rem] rounded-3xl bg-white shadow-inner ring-2 ring-pink-100">
        <div
          id={outlineTargetId}
          className="pointer-events-none absolute inset-0 z-0 h-full w-full touch-none"
        />
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          onPointerDown={startStroke}
          onPointerMove={drawStroke}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          className="absolute inset-0 z-10 h-full w-full touch-none"
          aria-label={`临摹 ${item.char}`}
        />
        <div
          id={demoTargetId}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full touch-none"
        />
        {loading ? (
          <div className="absolute inset-0 z-30 grid place-items-center text-sm font-bold text-slate-400">
            正在准备笔顺...
          </div>
        ) : null}
        {failed ? (
          <div className="absolute inset-0 z-30 grid place-items-center p-4 text-center text-sm font-bold text-rose-500">
            这个字的笔顺数据暂时没准备好
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={clearPractice}
          disabled={strokeCount === 0}
          className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow ring-1 ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-40"
        >
          🧽 清理
        </button>
        <button
          type="button"
          onClick={undoPractice}
          disabled={strokeCount === 0}
          className="min-h-11 rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow ring-1 ring-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 disabled:opacity-40"
        >
          ↩️ 回撤
        </button>
      </div>
    </div>
  );
}
