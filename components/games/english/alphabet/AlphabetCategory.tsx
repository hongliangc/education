"use client";

import { useState } from "react";
import { ALPHABET } from "@/content/english/alphabet";
import { AlphabetLesson } from "./AlphabetLesson";
import { AlphabetSong } from "./AlphabetSong";
import { LetterGrid } from "./LetterGrid";

export function AlphabetCategory() {
  const [mode, setMode] = useState<number | "song" | null>(null);

  if (mode === "song") {
    return <AlphabetSong onExit={() => setMode(null)} />;
  }

  if (typeof mode === "number") {
    return <AlphabetLesson startIndex={mode} onExit={() => setMode(null)} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setMode("song")}
        className="mb-4 w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-4 text-left text-white shadow-lg shadow-fuchsia-100 transition hover:scale-[1.01]"
      >
        <span className="text-2xl font-black">🎵 字母歌</span>
        <span className="mt-1 block text-sm font-bold text-white/80">A 到 Z 连起来，一起唱完再出发！</span>
      </button>
      <LetterGrid entries={ALPHABET} onSelect={setMode} />
    </div>
  );
}
