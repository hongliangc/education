"use client";

import { useEffect, useRef, useState } from "react";
import type { IdiomLesson } from "@/content/hanzi";
import { speakChunks, type SpeechController } from "@/lib/speech";
import { HanziShell } from "./HanziShell";

type IdiomTab = "read" | "story" | "quiz";

export function HanziIdiomLesson({ lesson, lessons, onSelectLesson, onBack, onExplained, onAnswer, onComplete }: {
  lesson: IdiomLesson;
  lessons: readonly IdiomLesson[];
  onSelectLesson: (lessonId: string) => void;
  onBack: () => void;
  onExplained: () => void;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
}) {
  const [tab, setTab] = useState<IdiomTab>("read");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const quiz = lesson.quiz[quizIndex];
  const choices = quiz ? "choices" in quiz ? quiz.choices : [quiz.answer, ...lesson.keyChars.filter((char) => !quiz.answer.includes(char))].slice(0, 3) : [];
  const speak = (text: string) => { speechRef.current?.stop(); speechRef.current = speakChunks(text, { lang: "zh-CN", rate: 0.9 }); };

  useEffect(() => () => { speechRef.current?.stop(); speechRef.current = null; }, []);
  useEffect(() => { speechRef.current?.stop(); setQuizIndex(0); setSelected(null); setFeedback(null); setTab("read"); }, [lesson.id]);

  const answerQuiz = (choice: string) => {
    speechRef.current?.stop();
    setSelected(choice);
    if (!quiz) return;
    const correct = choice === quiz.answer;
    onAnswer(correct);
    setFeedback(correct ? "答对啦，学习记录已更新" : `再想一想，正确答案是“${quiz.answer}”`);
  };
  const nextQuiz = () => {
    setSelected(null); setFeedback(null);
    if (quizIndex + 1 >= lesson.quiz.length) onComplete();
    else setQuizIndex((index) => index + 1);
  };
  const narrateQuiz = () => {
    if (!quiz) return;
    speak(`${quiz.prompt}。${choices.map((choice, index) => `选项 ${String.fromCharCode(65 + index)}，${choice}。`).join("")}`);
  };

  return (
    <HanziShell title="成语学习" subtitle={lesson.idiom} onBack={onBack} progress={`${quizIndex + 1}/${lesson.quiz.length}`} contentClassName="flex flex-col gap-3">
      <div className="relative flex items-center gap-2">
        <button type="button" onClick={() => setCatalogOpen((open) => !open)} aria-expanded={catalogOpen} className="min-h-10 rounded-xl bg-[#fff2d9] px-4 text-xs font-black text-[#a8652b] ring-1 ring-[#ebc78e]">成语目录 {catalogOpen ? "收起" : "展开"}</button>
        <div className="min-w-0 flex-1 overflow-x-auto"><div className="flex gap-2">{lessons.slice(0, 8).map((item) => <button key={item.id} type="button" onClick={() => onSelectLesson(item.id)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ${item.id === lesson.id ? "bg-[#8e62c8] text-white" : "bg-white text-[#776b64] ring-1 ring-[#e3d8ce]"}`}>{item.idiom}</button>)}</div></div>
      </div>
      {catalogOpen ? <div className="z-10 grid max-h-40 shrink-0 grid-cols-2 gap-2 overflow-y-auto rounded-2xl border-2 border-[#ddc6ed] bg-white p-3 shadow-lg sm:grid-cols-4">{lessons.map((item) => <button key={item.id} type="button" onClick={() => { onSelectLesson(item.id); setCatalogOpen(false); }} className={`min-h-10 rounded-xl px-2 text-sm font-black ${item.id === lesson.id ? "bg-[#f1e6fb] text-[#70449d] ring-2 ring-[#a77acb]" : "bg-[#faf7f2] text-[#6e625a] ring-1 ring-[#e8dfd5]"}`}>{item.idiom}</button>)}</div> : null}

      <nav aria-label="成语学习步骤" className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-1.5 ring-1 ring-[#e7dbcd]">
        <IdiomTabButton active={tab === "read"} label="读成语" onClick={() => setTab("read")} />
        <IdiomTabButton active={tab === "story"} label="听典故" onClick={() => setTab("story")} />
        <IdiomTabButton active={tab === "quiz"} label="做小测" onClick={() => setTab("quiz")} />
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-[1.75rem] border-2 border-[#e7c990] bg-[#fffaf0] p-4 shadow-[0_5px_0_#cfad70] sm:p-6">
        {tab === "read" ? <div className="grid h-full content-center gap-5 lg:grid-cols-2 lg:items-center">
          <div className="rounded-[1.5rem] bg-[#f5edff] p-5 text-center ring-1 ring-[#dfc9ef]"><p className="text-xs font-black text-[#8a59b1]">读一读 · 记一记</p><h2 className="mt-2 text-4xl font-black tracking-[.18em] text-[#59433b] sm:text-6xl">{lesson.idiom}</h2><p className="mt-3 text-lg font-black text-[#e35d79]">{lesson.pinyin}</p><button type="button" onClick={() => speak(`${lesson.idiom}。${lesson.pinyin}`)} className="mt-4 min-h-11 rounded-xl bg-[#8e62c8] px-6 font-black text-white">朗读成语</button></div>
          <div><p className="text-xs font-black text-[#df7736]">成语意思</p><p className="mt-2 text-lg font-black leading-8 text-[#5f5148]">{lesson.meaning}</p><p className="mt-4 rounded-2xl bg-[#fff7e7] p-4 text-sm font-bold leading-7 text-[#706056] ring-1 ring-[#efd8ad]">例句：{lesson.example}</p><button type="button" onClick={() => setTab("story")} className="mt-4 min-h-11 w-full rounded-xl border-b-4 border-[#d74841] bg-[#ff6258] font-black text-white">下一步：听典故</button></div>
        </div> : null}

        {tab === "story" ? <div className="mx-auto flex h-full max-w-3xl flex-col justify-center"><p className="text-xs font-black text-[#8b5eb1]">成语典故 · {lesson.origin}</p><h2 className="mt-1 text-3xl font-black text-[#59443b]">{lesson.idiom}</h2><p className="mt-4 rounded-[1.5rem] bg-[#f8f1ff] p-5 text-base font-bold leading-8 text-[#66584f] ring-1 ring-[#e4d1f0]">{lesson.story}</p><div className="mt-4 grid grid-cols-2 gap-3"><button type="button" onClick={() => { setFeedback("典故听过啦，学习记录已更新"); speak(lesson.story); }} className="min-h-12 rounded-xl bg-[#eef8ff] font-black text-[#287ca5] ring-1 ring-[#b9def0]">看典故 · 听故事</button><button type="button" onClick={() => { onExplained(); setFeedback("太棒了！已经记下“我讲完了”"); }} className="min-h-12 rounded-xl bg-[#8e62c8] font-black text-white">我讲完了</button></div>{feedback ? <p className="mt-3 text-center text-sm font-black text-[#3a9362]">{feedback}</p> : null}</div> : null}

        {tab === "quiz" && quiz ? <div className="mx-auto flex h-full max-w-3xl flex-col justify-center"><div className="flex items-center justify-between"><p className="font-black text-[#5d4c43]">做小测 · {quizIndex + 1}/{lesson.quiz.length}</p><button type="button" onClick={narrateQuiz} aria-label="播报题目和选项" className="min-h-10 rounded-xl bg-[#eef8ff] px-3 text-xs font-black text-[#287ca5]">播报题目和选项</button></div><p className="mt-3 text-lg font-black leading-7 text-[#64564e]">{quiz.prompt}</p><div className="mt-4 grid gap-2 sm:grid-cols-3">{choices.map((choice) => <button key={choice} type="button" onClick={() => answerQuiz(choice)} disabled={selected !== null} className={`min-h-14 rounded-2xl px-3 text-sm font-black ring-2 ${selected === choice && choice === quiz.answer ? "bg-emerald-50 text-emerald-700 ring-emerald-300" : selected === choice ? "bg-rose-50 text-rose-600 ring-rose-200" : "bg-[#faf7f2] text-[#655950] ring-[#e5ddd4]"}`}>{choice}</button>)}</div>{feedback ? <p className="mt-3 text-center text-sm font-black text-[#557067]">{feedback}</p> : null}{selected ? <button type="button" onClick={nextQuiz} className="mt-4 min-h-12 rounded-xl bg-[#ff6258] font-black text-white">{quizIndex + 1 >= lesson.quiz.length ? "学习下一个成语" : "下一题"}</button> : null}</div> : null}
      </div>
    </HanziShell>
  );
}

function IdiomTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`min-h-10 rounded-xl text-sm font-black ${active ? "bg-[#8e62c8] text-white shadow-[0_3px_0_#70449c]" : "text-[#74675f] hover:bg-[#f7f1fb]"}`}>{label}</button>;
}
