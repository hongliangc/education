"use client";

import { useState } from "react";
import Image from "next/image";
import { BackButton } from "@/components/BackButton";

const PAGES = [
  "很久以前，魔法王国迎来了一位勇敢的小公主。她喜欢帮助朋友，也喜欢探索城堡外面的世界。",
  "在魔法王国里，善良的公主和小龙一起守护着这片土地。他们帮助村民，传递爱与勇气。每一天，王国都充满了欢笑和希望。",
  "一天，他们发现森林里的花朵失去了颜色。公主和小龙沿着河流寻找答案，终于用勇气和友谊唤醒了沉睡的春天。",
  "小龙展开翅膀，把春天的消息带到远方。山谷里的动物们纷纷走出家门，一起庆祝新的开始。",
  "公主告诉大家，真正的魔法不是宝石和咒语，而是愿意互相帮助的心。",
  "村民们重新种下花种，小龙负责浇水，公主则每天为它们唱歌。",
  "不久以后，整个王国开满了五颜六色的花，每个人的脸上都露出了笑容。",
  "从那以后，公主和小龙继续守护王国，把勇气、善良和希望送给每一位朋友。",
] as const;

export function VisualStoryReader({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState(1);

  return (
    <main className="min-h-screen px-3 pb-6 pt-20">
      <article className="storybook-paper mx-auto max-w-2xl rounded-[2rem] p-3 sm:p-5">
        <header className="mb-3 grid grid-cols-[48px_1fr_48px] items-center gap-2">
          <BackButton label="返回目录" onClick={onBack} className="h-12 overflow-hidden px-3 text-[0] after:text-base after:content-['←']" />
          <div className="relative flex h-16 items-center justify-center">
            <Image src="/ui/titles/story-wood-v1.png" alt="" fill sizes="500px" className="object-contain" />
            <h1 className="relative z-10 text-2xl font-black text-white drop-shadow-[0_2px_1px_#78350f]">故事书架</h1>
          </div>
          <button type="button" aria-label="朗读故事" className="h-12 w-12 rounded-full border-2 border-amber-200 bg-white text-2xl text-blue-600 shadow">♪</button>
        </header>

        <Image src="/ui/story/storybook-hero-v1.png" alt="公主和小龙守护魔法王国" width={1200} height={675} preload className="aspect-[16/9] w-full rounded-2xl border-4 border-amber-100 object-cover" />
        <p className="min-h-28 whitespace-pre-line px-2 py-4 text-base font-medium leading-7 text-slate-800">{PAGES[page]}</p>

        <footer className="grid grid-cols-[52px_1fr_120px] items-center gap-3">
          <button type="button" aria-label="朗读当前页" className="h-12 w-12 rounded-full bg-blue-500 text-2xl text-white shadow-[0_5px_0_#0369a1]">♪</button>
          <div className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-center font-bold text-slate-700">{page + 1} / {PAGES.length}<div className="mt-1 flex justify-center gap-1">{PAGES.map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === page ? 'bg-amber-500' : 'bg-amber-100'}`} />)}</div></div>
          <button type="button" onClick={() => setPage((value) => Math.min(PAGES.length - 1, value + 1))} className="min-h-12 rounded-2xl bg-blue-500 px-4 font-black text-white shadow-[0_5px_0_#0369a1]">下一页</button>
        </footer>
      </article>
    </main>
  );
}
