"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";

const WORDS = [
  { word: "apple", image: "/ui/english/apple-v1.png", stars: 3, done: true },
  { word: "ball", image: "/ui/english/ball-v1.png", stars: 3, done: true },
  { word: "cat", image: "/ui/english/cat-v1.png", stars: 2, done: false },
] as const;

export function VisualEnglishHub() {
  const router = useRouter();

  return (
    <main className="mx-auto min-h-full w-full px-4 pb-8 pt-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-3 flex items-center justify-between">
          <BackButton label="返回世界" onClick={() => router.push("/world?visual=1")} />
          <div className="flex items-center gap-2">
            <Image src="/ui/islands/english.webp" alt="" width={64} height={64} className="h-14 w-14 object-contain" />
            <h1 className="text-3xl font-black text-blue-800">英语岛</h1>
          </div>
          <button type="button" aria-label="播放说明" className="h-12 w-12 rounded-full border-2 border-amber-200 bg-white text-2xl text-blue-600 shadow">♪</button>
        </header>

        <nav className="grid grid-cols-3 gap-2" aria-label="英语学习分类">
          {['单词乐园', '句子王国', '自然拼读'].map((label, index) => (
            <button key={label} type="button" aria-pressed={index === 0} className={`rounded-t-2xl border-2 border-b-0 px-2 py-3 font-black ${index === 0 ? 'border-blue-400 bg-blue-500 text-white' : 'border-amber-200 bg-[#fffaf0] text-slate-700'}`}>{label}</button>
          ))}
        </nav>

        <section className="storybook-paper rounded-b-[2rem] rounded-tr-[2rem] p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <span className="shrink-0 text-sm font-black text-blue-700">学习进度</span>
            <div role="progressbar" aria-valuenow={6} aria-valuemin={0} aria-valuemax={12} className="h-4 flex-1 overflow-hidden rounded-full border border-amber-200 bg-amber-100">
              <div className="h-full w-1/2 rounded-full bg-gradient-to-b from-lime-300 to-green-500" />
            </div>
            <span className="text-sm font-bold text-slate-600">6/12</span>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {WORDS.map((item) => (
              <button key={item.word} type="button" onClick={() => router.push('/play/alphabet?visual=1')} className="flex min-w-0 flex-col rounded-2xl border-2 border-amber-200 bg-white p-2 shadow-sm transition hover:-translate-y-1">
                <Image src={item.image} alt={item.word} width={160} height={160} className="aspect-square w-full object-contain" />
                <strong className="text-sm text-slate-800 sm:text-base">{item.word}</strong>
                <span className="mt-1 text-xs font-black text-amber-500">{'★'.repeat(item.stars)}{'☆'.repeat(3 - item.stars)}</span>
                <span className={`mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-full text-sm font-black text-white ${item.done ? 'bg-green-500' : 'bg-slate-400'}`}>{item.done ? '✓' : '•'}</span>
              </button>
            ))}
            {['dog', 'egg'].map((word) => (
              <div key={word} className="flex min-w-0 flex-col items-center justify-center rounded-2xl border-2 border-slate-200 bg-slate-100 p-2 text-slate-400">
                <span className="text-3xl">●</span><strong className="mt-3 text-sm sm:text-base">{word}</strong><span className="mt-3 text-xs">未解锁</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
