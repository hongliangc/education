"use client";

import { useState } from "react";
import { AlphabetBoard } from "./AlphabetBoard";
import { AlphabetSong } from "./AlphabetSong";

export function AlphabetCategory() {
  const [song, setSong] = useState(false);

  if (song) {
    return <AlphabetSong onExit={() => setSong(false)} />;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setSong(true)}
        className="mb-4 w-full rounded-3xl bg-gradient-to-r from-fuchsia-500 to-violet-500 px-5 py-4 text-left text-white shadow-lg shadow-fuchsia-100 transition hover:scale-[1.01]"
      >
        <span className="text-2xl font-black">🎵 字母歌</span>
        <span className="mt-1 block text-sm font-bold text-white/80">A 到 Z 连起来，一起唱完再出发！</span>
      </button>
      <AlphabetBoard />
    </div>
  );
}
