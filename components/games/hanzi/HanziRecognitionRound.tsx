"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { useSFX } from "@/components/audio/useSFX";
import { speakChunks, type SpeechController } from "@/lib/speech";
import {
  generateHanziChallengesFromPool,
  hanziQuestionSpeechText,
  type HanziItem,
  type HanziChallenge,
} from "@/content/hanzi";
import type { OnComplete } from "../types";
import { GameDone } from "../GameDone";
import { HanziShell } from "./HanziShell";
import { showFairyGuide } from "@/lib/fairy-guide";

export function HanziRecognitionRound({
  onResult,
  onComplete,
  onExit,
  onChangeMode,
  roundSize = 8,
  title = "认字闯关",
  items,
  distractorPool,
}: {
  onResult: (hanziId: string, correct: boolean) => void;
  onComplete: OnComplete;
  onExit: () => void;
  onChangeMode: () => void;
  roundSize?: number;
  title?: string;
  items: readonly HanziItem[];
  distractorPool: readonly HanziItem[];
}) {
  const [round, setRound] = useState<HanziChallenge[]>(() =>
    generateHanziChallengesFromPool(items, distractorPool, roundSize, Math.random),
  );
  const [qi, setQi] = useState(0);
  const [correctQ, setCorrectQ] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [done, setDone] = useState(false);
  const { sfx } = useSFX();
  const startedAt = useRef(Date.now());
  const speechRef = useRef<SpeechController | null>(null);

  const question = round[qi];

  const restart = useCallback(
    () => {
      setRound(generateHanziChallengesFromPool(items, distractorPool, roundSize, Math.random));
      setQi(0);
      setCorrectQ(0);
      setFeedback(null);
      setDone(false);
      startedAt.current = Date.now();
    },
    [distractorPool, items, roundSize],
  );

  const replay = useCallback(() => {
    speechRef.current?.stop();
    speechRef.current = question
      ? speakChunks(hanziQuestionSpeechText(question), { lang: "zh-CN", rate: 0.9 })
      : null;
  }, [question]);

  useEffect(() => {
    replay();
    return () => {
      speechRef.current?.stop();
      speechRef.current = null;
    };
  }, [replay]);

  if (done) {
    const stars = Math.max(1, Math.round((correctQ / round.length) * 3));
    return (
      <HanziShell title="认字完成" subtitle="今天又认识了新朋友" onBack={onExit}>
        <div className="mx-auto max-w-2xl rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-5 shadow-[0_6px_0_#cfad70]">
          <GameDone starsEarned={stars} correctQ={correctQ} totalQ={round.length} onAgain={() => restart()} onClose={onExit} onChangeMode={onChangeMode} changeModeLabel="去练写字" />
        </div>
      </HanziShell>
    );
  }

  if (!question) {
    return (
      <HanziShell title="认字闯关" subtitle="复习已经完成" onBack={onExit}>
        <div className="mx-auto max-w-2xl space-y-5 rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-5 text-center shadow-[0_6px_0_#cfad70]">
          <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-700 ring-1 ring-emerald-100">
            <div className="text-4xl">✅</div>
            <div className="mt-2 text-lg font-bold">这个年级暂时都掌握了</div>
            <div className="mt-1 text-sm">到复习时间后，这些字会自动回到练习里。</div>
          </div>
          <Btn variant="ghost" onClick={onChangeMode}>✏️ 去练写字</Btn>
        </div>
      </HanziShell>
    );
  }

  const choose = (choiceId: string) => {
    if (feedback) return;
    speechRef.current?.stop();
    speechRef.current = null;
    const ok = choiceId === question.answerId;
    onResult(question.answerId, ok);
    setFeedback(ok ? "correct" : "wrong");
    showFairyGuide({
      event: ok ? "correct" : "incorrect",
      text: ok ? "认对啦！把这个字再读一遍。" : "先听读音，再比较每个字的样子。",
      autoHideMs: 3200,
    });
    if (ok) {
      sfx.correct();
      setCorrectQ((value) => value + 1);
    } else {
      sfx.wrong();
    }
    setTimeout(() => {
      setFeedback(null);
      if (qi + 1 >= round.length) {
        const correct = ok ? correctQ + 1 : correctQ;
        const stars = Math.max(1, Math.round((correct / round.length) * 3));
        onComplete({
          score: correct * 12,
          totalQ: round.length,
          correctQ: correct,
          durationSec: Math.round((Date.now() - startedAt.current) / 1000),
          starsEarned: stars,
        });
        showFairyGuide({
          event: "complete",
          text: `认字闯关完成！答对 ${correct} 题，获得 ${stars} 颗星。`,
          autoHideMs: 6500,
        });
        setDone(true);
      } else {
        setQi((value) => value + 1);
      }
    }, 650);
  };

  return (
    <HanziShell title={title} subtitle="识字校验" onBack={onExit} progress={`${qi + 1}/${round.length}`}>
      <div className="mx-auto max-w-3xl rounded-[2rem] border-2 border-[#e7c990] bg-[#fffaf0] p-4 shadow-[0_6px_0_#cfad70] sm:p-6">
      <div className="rounded-3xl border border-[#b9dff0] bg-[#eaf7ff] p-5 text-center">
        <div className="text-sm font-bold text-pink-500">第 {qi + 1} 题 / 共 {round.length} 题</div>
        <div className="mt-2 text-2xl font-bold text-slate-800">{question.prompt}</div>
        <button
          type="button"
          onClick={replay}
          aria-label="再听一次"
          className="mt-3 rounded-full bg-white px-4 py-2 text-xl shadow ring-1 ring-pink-100"
        >
          🔊
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {question.choices.map((choice) => {
          const answer = choice.id === question.answerId;
          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => choose(choice.id)}
              disabled={!!feedback}
                className={`min-h-28 rounded-3xl bg-white p-5 text-center shadow-[0_4px_0_#dfd4c0] ring-2 transition ${
                feedback && answer
                  ? "ring-emerald-300 bg-emerald-50 anim-correct"
                  : "ring-slate-100 hover:bg-sky-50"
              }`}
                >
                  <span className="block text-center text-5xl font-bold text-slate-800">{choice.char}</span>
                </button>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Btn variant="ghost" onClick={onChangeMode}>
          ✏️ 去练写字
        </Btn>
      </div>
      </div>
    </HanziShell>
  );
}
