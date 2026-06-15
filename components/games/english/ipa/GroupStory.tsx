"use client";

import type { GroupInfo } from "@/content/english/ipa";
import { ExampleChainButton } from "./GroupChant";

export function GroupStory({
  info,
  words,
}: {
  info: GroupInfo;
  words: readonly string[];
}) {
  return (
    <section className="mb-4 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 ring-2 ring-amber-200">
      <div className="text-sm font-black text-amber-600">📖 {info.group}记忆小故事</div>
      <p className="mt-2 text-base font-bold leading-7 text-slate-700">{info.story}</p>
      <p className="mt-2 text-xs font-bold text-slate-400">故事只用来阅读，点按钮听纯英文例词。</p>
      <div className="mt-3">
        <ExampleChainButton words={words} />
      </div>
    </section>
  );
}
