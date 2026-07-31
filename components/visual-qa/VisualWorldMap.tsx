"use client";

import Image from "next/image";
import type { ModuleId } from "@/lib/utils";
import { MODULE_ART } from "@/lib/ui-assets";

const ISLANDS: Array<{ id: ModuleId; label: string; left: string; top: string }> = [
  { id: "WRITING", label: "汉字探险", left: "13%", top: "24%" },
  { id: "ALPHABET", label: "英语岛", left: "39%", top: "19%" },
  { id: "MATH", label: "数学岛", left: "69%", top: "20%" },
  { id: "WORDS", label: "词语乐园", left: "22%", top: "53%" },
  { id: "LITERATURE", label: "诸子智慧", left: "78%", top: "50%" },
  { id: "STORY", label: "故事城堡", left: "49%", top: "50%" },
  { id: "HISTORY", label: "历史长卷", left: "50%", top: "73%" },
];

export function VisualWorldMap({
  onOpen,
  onTheater,
  onShop,
}: {
  onOpen: (module: ModuleId) => void;
  onTheater: () => void;
  onShop: () => void;
}) {
  return (
    <main className="relative z-10 min-h-screen px-3 pb-4 pt-16 sm:px-6">
      <section className="relative mx-auto aspect-[16/9] w-full max-w-[1180px] overflow-hidden rounded-[2rem] border-[5px] border-slate-800 bg-sky-200 shadow-2xl">
        <Image src="/ui/world/world-bg-desktop-v1.png" alt="魔法学习王国地图" fill preload sizes="1180px" className="object-cover" />
        {ISLANDS.map((island) => (
          <button key={island.id} type="button" onClick={() => onOpen(island.id)} aria-label={`进入${island.label}`} className={`group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:ring-4 focus-visible:ring-white ${island.id === "STORY" || island.id === "HISTORY" ? "w-[14%]" : "w-[17%]"}`} style={{ left: island.left, top: island.top }}>
            <Image src={MODULE_ART[island.id]} alt="" width={320} height={240} className="w-full object-contain drop-shadow-xl transition group-hover:-translate-y-1" />
            <span className="mx-auto -mt-4 block w-max rounded-full bg-slate-700/90 px-4 py-1 text-sm font-black text-white shadow sm:text-base">{island.label}</span>
          </button>
        ))}
        <button type="button" onClick={onTheater} className="absolute bottom-4 left-5 flex w-[24%] items-center rounded-3xl border-2 border-amber-300 bg-[#fff8e8]/95 px-3 py-2 text-left shadow-lg">
          <Image src="/ui/locations/cinema.webp" alt="" width={96} height={80} className="h-16 w-auto object-contain" /><strong className="ml-2 text-lg text-blue-900">视频影院</strong>
        </button>
        <button type="button" onClick={onShop} className="absolute bottom-4 right-5 flex w-[24%] items-center rounded-3xl border-2 border-amber-300 bg-[#fff8e8]/95 px-3 py-2 text-left shadow-lg">
          <Image src="/ui/locations/shop.webp" alt="" width={96} height={80} className="h-16 w-auto object-contain" /><strong className="ml-2 text-lg text-amber-900">星星商店</strong>
        </button>
      </section>
    </main>
  );
}
