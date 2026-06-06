"use client";

import { useMemo } from "react";
import type { SubLine } from "@/lib/speech/subtitle";

export function SubtitleLine({
  text,
  lines,
  charIndex,
  onCharClick,
  interactive,
}: {
  text: string;
  lines: SubLine[];
  charIndex: number;
  onCharClick: (globalIndex: number) => void;
  interactive: boolean;
}) {
  const allChars = useMemo(() => Array.from(text), [text]);

  if (lines.length === 0) return null;

  let lineIndex =
    charIndex < 0
      ? 0
      : lines.findIndex((line) => charIndex >= line.start && charIndex < line.end);
  if (lineIndex < 0) lineIndex = lines.length - 1;

  const line = lines[lineIndex];
  const localHighlight = charIndex < 0 ? -1 : charIndex - line.start;

  return (
    <div
      key={lineIndex}
      className="anim-pop-in flex min-h-[3.5rem] select-none items-center justify-center text-center text-2xl leading-relaxed text-slate-700"
    >
      <p>
        {allChars.slice(line.start, line.end).map((char, index) => {
          if (/\s/u.test(char)) return <span key={index}> </span>;

          const active = index === localHighlight;
          return (
            <span
              key={index}
              onClick={interactive ? () => onCharClick(line.start + index) : undefined}
              className={`rounded px-0.5 transition ${
                interactive ? "cursor-pointer hover:bg-amber-100/60" : "cursor-default"
              } ${
                active ? "bg-amber-300 text-amber-900" : ""
              }`}
            >
              {char}
            </span>
          );
        })}
      </p>
    </div>
  );
}
