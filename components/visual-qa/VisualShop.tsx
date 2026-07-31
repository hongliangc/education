"use client";

import Image from "next/image";
import { BackButton } from "@/components/BackButton";

const PRODUCTS = [
  { title: "魔法帽子", cost: 30, stock: 3, image: "/ui/shop/magic-hat-v1.png" },
  { title: "彩虹翅膀", cost: 50, stock: 2, image: "/ui/shop/rainbow-wings-v1.png" },
  { title: "小龙伙伴", cost: 80, stock: 1, image: "/ui/shop/baby-dragon-v1.png" },
  { title: "城堡音乐盒", cost: 100, stock: 1, image: "/ui/shop/castle-music-box-v1.png" },
] as const;

export function VisualShop({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen px-4 pb-8 pt-20">
      <section className="storybook-paper mx-auto max-w-5xl rounded-[2rem] p-4 sm:p-6">
        <header className="mb-5 grid grid-cols-[120px_1fr_90px] items-center gap-3">
          <BackButton label="返回世界" onClick={onBack} />
          <div className="relative mx-auto flex h-20 w-full max-w-md items-center justify-center">
            <Image src="/ui/titles/shop-ribbon-v1.png" alt="" fill preload sizes="448px" className="object-contain" />
            <h1 className="relative z-10 text-3xl font-black text-white drop-shadow-[0_2px_1px_#581c87]">★ 星星商店 ★</h1>
          </div>
          <span className="rounded-2xl border border-amber-200 bg-white px-3 py-2 text-center text-lg font-black text-amber-500">★ 45</span>
        </header>

        <div className="grid grid-cols-4 gap-3">
          {PRODUCTS.map((product) => (
            <article key={product.title} className="rounded-2xl border-2 border-amber-200 bg-white p-3 text-center shadow-sm">
              <Image src={product.image} alt={product.title} width={220} height={220} className="aspect-square w-full object-contain" />
              <h2 className="font-black text-slate-800">{product.title}</h2>
              <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 py-1 font-black text-amber-600">★ {product.cost}</p>
              <p className="mt-1 text-xs text-slate-500">剩余：{product.stock}</p>
            </article>
          ))}
        </div>

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-3">
          <h2 className="mb-2 font-black text-slate-700">最近兑换</h2>
          {[['魔法帽子', '2024-05-20', 30, '/ui/shop/magic-hat-v1.png'], ['彩虹翅膀', '2024-05-15', 50, '/ui/shop/rainbow-wings-v1.png']].map(([title, date, cost, image]) => (
            <div key={title} className="grid grid-cols-[36px_1fr_110px_70px] items-center gap-2 border-t border-amber-200 py-2 text-sm">
              <Image src={image as string} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
              <strong className="text-slate-700">{title}</strong><span className="text-slate-500">{date}</span><span className="text-right font-black text-slate-700">-{cost} ★</span>
            </div>
          ))}
        </section>
      </section>
    </main>
  );
}
