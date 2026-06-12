// components/games/literature/ClassicReader.tsx
// 寓言「经典原文版」逐句精读：原句 → (拼音) → 白话直译 → 可展开的字词典故 → 朗读 / 问问精灵。
// 复用 FairyChat 接地语音问答，每句单独成 context，让精灵贴着这一句作答。
"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { FairyChat } from "@/components/fairy/FairyChat";
import { useSFX } from "@/components/audio/useSFX";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import type { ClassicLine, ClassicText } from "@/content/classics/types";
import { GlossaryNotes } from "./GlossaryNotes";

// 接地内容：给精灵整段背景 + 全文顺序（标出当前句）+ 这句的直译与字词典故，
// 让「语句解读」不是孤零零解释一句，而能联系上下文和典故讲清楚。
function storyContext(classic: ClassicText, current: ClassicLine): string {
  const seq = classic.lines
    .map((l, i) => `${i + 1}. ${l.original}${l === current ? "  ← 现在讲这句" : ""}`)
    .join("\n");
  const notes = (current.notes ?? [])
    .map((n) => `${n.term}（${n.kind}）：${n.explain}`)
    .join("；");
  return [
    `这是${classic.source}里的一小段。`,
    classic.intro ? `背景：${classic.intro}` : "",
    `全文顺序：\n${seq}`,
    `要讲解的这句：「${current.original}」`,
    `直译：${current.translation}`,
    notes ? `字词典故：${notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// 「语句解读」开场指令：让精灵先主动把这句讲清楚（结合上下文与典故），再邀请孩子接着聊。
function openingPrompt(line: ClassicLine): string {
  return `请像给小朋友讲故事一样，解释这句「${line.original}」的意思。先用简单的话说清楚它在讲什么，再结合前后的故事和里面的字词典故帮我理解，别太长。最后轻轻问我一句，看我懂了没、想不想接着聊。`;
}

export function ClassicReader({
  title,
  emoji,
  classic,
  child,
}: {
  title: string;
  emoji: string;
  classic: ClassicText;
  child: { name: string; age?: number; totalStars?: number };
}) {
  const [chatLine, setChatLine] = useState<ClassicLine | null>(null);
  const { sfx } = useSFX();
  const speakRef = useRef<SpeechController | null>(null);

  // 离开页面 / 切版本时停掉朗读，避免声音残留
  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const read = (line: ClassicLine) => {
    sfx.click();
    speakRef.current?.stop();
    speakRef.current = speakText(line.original, { lang: "zh-CN", rate: 0.7 });
  };

  const interpret = (line: ClassicLine) => {
    sfx.pop();
    speakRef.current?.stop();
    setChatLine(line);
  };

  return (
    <div>
      <div className="mb-3 text-center">
        <h3 className="text-2xl font-bold text-slate-700">
          {emoji} {title}
        </h3>
        <p className="mt-0.5 text-sm font-bold text-teal-700">{classic.source}</p>
      </div>

      {classic.intro && (
        <p className="mb-4 rounded-2xl bg-teal-50 px-4 py-3 text-sm leading-relaxed text-teal-800 ring-1 ring-teal-100">
          {classic.intro}
        </p>
      )}

      <ol className="flex flex-col gap-3">
        {classic.lines.map((line, idx) => (
          <li
            key={idx}
            className="anim-pop-in rounded-3xl bg-white p-4 ring-1 ring-teal-100"
          >
            <p className="text-xl font-bold leading-relaxed tracking-wide text-slate-800">
              {line.original}
            </p>
            {line.pinyin && (
              <p className="mt-1 text-xs text-slate-400">{line.pinyin}</p>
            )}
            <p className="mt-2 text-base leading-relaxed text-slate-600">
              💡 {line.translation}
            </p>

            {line.notes && line.notes.length > 0 && (
              <details className="group mt-2">
                <summary className="cursor-pointer list-none text-sm font-bold text-teal-700">
                  🔎 字词典故
                  <span className="ml-1 text-xs font-normal text-slate-400 group-open:hidden">
                    （点开看）
                  </span>
                </summary>
                <GlossaryNotes notes={line.notes} />
              </details>
            )}

            <div className="mt-3 flex gap-2">
              <Btn size="sm" variant="secondary" onClick={() => read(line)}>
                🔊 朗读
              </Btn>
              <Btn size="sm" variant="primary" onClick={() => interpret(line)}>
                💬 语句解读
              </Btn>
            </div>
          </li>
        ))}
      </ol>

      {chatLine && (
        <FairyChat
          key={chatLine.original}
          child={child}
          context={storyContext(classic, chatLine)}
          opening={openingPrompt(chatLine)}
          onClose={() => setChatLine(null)}
        />
      )}
    </div>
  );
}
