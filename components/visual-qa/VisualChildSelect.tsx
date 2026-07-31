"use client";

import Image from "next/image";
import type { ChildSummary } from "@/store/gameStore";

const PROFILES = [
  { name: "小星星", grade: "一年级", stars: 45, image: "/ui/characters/child-girl-star-v1.png" },
  { name: "小魔法师", grade: "二年级", stars: 32, image: "/ui/characters/child-explorer-v1.png" },
  { name: "小甜甜", grade: "幼儿园大班", stars: 18, image: "/ui/characters/child-girl-sweet-v1.png" },
] as const;

export function VisualChildSelect({
  children,
  onPick,
  onAdd,
}: {
  children: ChildSummary[];
  onPick: (child: ChildSummary) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center pt-1">
      <header className="relative mb-8 flex h-24 w-full max-w-xl items-center justify-center sm:h-28">
        <Image src="/ui/titles/child-select-ribbon-v1.png" alt="" fill preload sizes="576px" className="object-contain" />
        <h1 className="relative z-10 text-3xl font-black tracking-wide text-white drop-shadow-[0_2px_1px_#9f1239] sm:text-4xl">★ 选择小冒险家 ★</h1>
      </header>

      <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {PROFILES.map((profile, index) => (
          <button
            key={profile.name}
            type="button"
            onClick={() => children[0] ? onPick(children[0]) : onAdd()}
            className="storybook-paper flex min-h-64 flex-col rounded-3xl p-3 text-center transition hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-pink-400 sm:min-h-72"
          >
            <Image
              src={profile.image}
              alt={`${profile.name}角色`}
              width={240}
              height={240}
              preload={index === 0}
              className="mx-auto h-36 w-full object-contain sm:h-40"
            />
            <strong className="mt-1 text-lg text-slate-800">{profile.name}</strong>
            <span className="text-sm text-slate-500">{profile.grade}</span>
            <span className="mt-auto rounded-2xl border border-amber-200 bg-amber-50 py-2 font-black text-amber-600">★ {profile.stars}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className="storybook-paper flex min-h-64 flex-col items-center justify-center rounded-3xl p-4 text-blue-600 transition hover:-translate-y-1 focus-visible:ring-4 focus-visible:ring-blue-400 sm:min-h-72"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-500 text-6xl font-light text-white shadow-[inset_0_3px_0_#ffffff88,0_6px_0_#1766c4]">＋</span>
          <strong className="mt-6">添加小冒险家</strong>
        </button>
      </div>
    </div>
  );
}
