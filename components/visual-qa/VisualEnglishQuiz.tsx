"use client";

import { useState } from "react";
import Image from "next/image";

export function VisualEnglishQuiz() {
  const [answer, setAnswer] = useState<string | null>(null);
  const choices = ["apple", "banana", "cat", "ball"];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-3xl text-amber-500">★</span>
        <div className="h-4 flex-1 overflow-hidden rounded-full border border-amber-200 bg-amber-100"><div className="h-full w-2/5 rounded-full bg-green-500" /></div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-600">2/5</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_170px]">
        <section className="storybook-paper rounded-[2rem] p-5 text-center">
          <h2 className="text-xl font-black text-slate-800">这是哪个单词？</h2>
          <Image src="/ui/english/apple-v1.png" alt="红苹果" width={320} height={320} preload className="mx-auto h-56 w-56 object-contain" />
          <div className="grid grid-cols-2 gap-3">
            {choices.map((choice, index) => (
              <button key={choice} type="button" onClick={() => setAnswer(choice)} className={`min-h-14 rounded-2xl border-2 py-3 text-lg font-black text-white shadow-[0_5px_0_var(--shadow)] transition active:translate-y-1 active:shadow-none ${index % 2 === 0 ? 'border-pink-600 bg-pink-500 [--shadow:#be185d]' : 'border-sky-600 bg-sky-400 [--shadow:#0284c7]'}`}>{choice}</button>
            ))}
          </div>
        </section>
        <aside className="flex flex-col items-center justify-center text-center">
          <Image src="/ui/mascot/fairy-guide.webp" alt="精灵小星" width={150} height={190} className="h-44 w-auto object-contain" />
          <p aria-live="polite" className="storybook-paper rounded-2xl px-3 py-3 font-bold text-slate-700">{answer === 'apple' ? '太棒了！你真厉害！' : answer ? '再想一想哦！' : '选出正确答案吧！'}</p>
        </aside>
      </div>
      <button type="button" disabled={answer !== 'apple'} className="mx-auto mt-5 block min-h-12 rounded-full bg-pink-500 px-12 py-3 font-black text-white shadow-lg disabled:opacity-40">继续</button>
    </div>
  );
}
