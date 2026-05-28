"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakText, stopSpeaking } from "@/lib/speech";
import { STORIES, type Story } from "@/content/stories";
import type { OnComplete } from "./types";
import { GameDone } from "./GameDone";

type Phase = "reading" | "question" | "done";

const RATES = [
  { label: "🐢 慢", value: 0.7 },
  { label: "🐰 中", value: 1 },
  { label: "⚡ 快", value: 1.25 },
];

export function StoryGame({ onComplete }: { onComplete: OnComplete }) {
  const [storyIdx, setStoryIdx] = useState(0);
  const story: Story = STORIES[storyIdx];
  const [phase, setPhase] = useState<Phase>("reading");
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const [qi, setQi] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [correctQ, setCorrectQ] = useState(0);
  const [showMoral, setShowMoral] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const stopRef = useRef<(() => void) | null>(null);

  const chars = Array.from(story.text);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopRef.current?.();
    };
  }, []);

  const play = async () => {
    if (playing) {
      stopRef.current?.();
      setPlaying(false);
      setHighlight(-1);
      return;
    }
    sfx.pageFlip();
    setPlaying(true);
    setHighlight(0);
    const stop = await speakText(story.text, {
      lang: "zh-CN",
      rate,
      onWord: (i) => setHighlight(i),
      onEnd: () => {
        setPlaying(false);
        setHighlight(-1);
      },
    });
    stopRef.current = stop;
  };

  const choose = (i: number) => {
    if (chosen !== null) return;
    const q = story.questions[qi];
    const ok = i === q.answer;
    setChosen(i);
    if (ok) {
      sfx.correct();
      setCorrectQ((c) => c + 1);
    } else sfx.wrong();
    speakText(q.explain, { lang: "zh-CN", rate: 0.95 });
  };

  const nextQuestion = () => {
    setChosen(null);
    if (qi + 1 >= story.questions.length) {
      setShowMoral(true);
      sfx.fanfare();
      speakText(story.moral, { lang: "zh-CN", rate: 0.9 });
    } else {
      setQi((i) => i + 1);
    }
  };

  const finishStory = () => {
    const stars =
      correctQ === story.questions.length ? 3 : correctQ >= story.questions.length - 1 ? 2 : 1;
    onComplete({
      score: correctQ * 33,
      totalQ: story.questions.length,
      correctQ,
      durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      starsEarned: stars,
    });
    setPhase("done");
  };

  if (phase === "done") {
    const stars =
      correctQ === story.questions.length ? 3 : correctQ >= story.questions.length - 1 ? 2 : 1;
    return (
      <GameDone
        starsEarned={stars}
        correctQ={correctQ}
        totalQ={story.questions.length}
        onAgain={() => {
          setStoryIdx((i) => (i + 1) % STORIES.length);
          setPhase("reading");
          setQi(0);
          setChosen(null);
          setCorrectQ(0);
          setShowMoral(false);
          setHighlight(-1);
          startedAt.current = Date.now();
        }}
        onClose={() => undefined}
      />
    );
  }

  if (phase === "reading") {
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold text-slate-700">
            {story.emoji} {story.title}
          </h3>
          <select
            value={storyIdx}
            onChange={(e) => {
              stopSpeaking();
              setPlaying(false);
              setStoryIdx(Number(e.target.value));
              setHighlight(-1);
              setQi(0);
              setChosen(null);
              setCorrectQ(0);
              setShowMoral(false);
              startedAt.current = Date.now();
            }}
            className="rounded-xl ring-1 ring-slate-200 px-3 py-1 text-sm bg-white"
          >
            {STORIES.map((s, i) => (
              <option key={s.id} value={i}>
                {s.emoji} {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl bg-amber-50 p-5 leading-loose text-lg text-slate-700 ring-1 ring-amber-100 anim-pop-in">
          {chars.map((c, i) => (
            <span
              key={i}
              onClick={() => {
                stopSpeaking();
                setHighlight(i);
                speakText(c, { lang: "zh-CN", rate });
              }}
              className={`cursor-pointer transition ${
                i === highlight
                  ? "bg-amber-200 text-amber-900 rounded px-0.5"
                  : "hover:bg-amber-100/60"
              }`}
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
          <Btn onClick={play} variant="primary" size="md">
            {playing ? "⏸ 暂停" : "▶ 听故事"}
          </Btn>
          <div className="flex items-center gap-1 bg-white rounded-2xl px-2 py-1 ring-1 ring-slate-200">
            {RATES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRate(r.value)}
                className={`text-sm px-2 py-1 rounded-xl ${
                  rate === r.value
                    ? "bg-pink-400 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Btn
            variant="secondary"
            onClick={() => {
              stopSpeaking();
              setPlaying(false);
              setPhase("question");
            }}
          >
            读完了，回答问题 →
          </Btn>
        </div>

        <p className="mt-2 text-xs text-center text-slate-400">
          小提示：点击任何一个字可以单独朗读它
        </p>
      </div>
    );
  }

  // question phase
  if (showMoral) {
    return (
      <div className="text-center anim-pop-in py-4">
        <div className="text-6xl">🌟</div>
        <h3 className="text-2xl font-bold text-amber-700 mt-3">道理</h3>
        <p className="mt-3 text-lg text-slate-700 leading-relaxed">{story.moral}</p>
        <Btn variant="primary" onClick={finishStory} className="mt-6">
          完成 ✨
        </Btn>
      </div>
    );
  }

  const q = story.questions[qi];

  return (
    <div>
      <div className="text-xs text-slate-400 mb-2">
        第 {qi + 1} 题 / 共 {story.questions.length} 题
      </div>
      <div className="rounded-2xl bg-purple-50 ring-1 ring-purple-100 p-4">
        <p className="font-bold text-slate-700">{q.q}</p>
      </div>
      <div className="mt-4 space-y-3">
        {q.choices.map((c, i) => {
          const isChosen = chosen === i;
          const isCorrect = q.answer === i;
          const reveal = chosen !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={chosen !== null}
              className={`w-full text-left rounded-2xl px-4 py-3 ring-2 transition ${
                reveal && isCorrect
                  ? "bg-emerald-100 ring-emerald-400 text-emerald-800"
                  : reveal && isChosen
                  ? "bg-rose-100 ring-rose-400 text-rose-800 anim-shake"
                  : "bg-white ring-slate-200 hover:bg-purple-50"
              }`}
            >
              <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
              {c}
            </button>
          );
        })}
      </div>

      {chosen !== null && (
        <div className="mt-4 rounded-2xl bg-amber-50 ring-1 ring-amber-200 p-4 anim-slide-up">
          <p className="text-sm text-amber-800 leading-relaxed">💡 {q.explain}</p>
          <div className="mt-3 text-right">
            <Btn variant="primary" onClick={nextQuestion}>
              {qi + 1 >= story.questions.length ? "看看道理 →" : "下一题 →"}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}
