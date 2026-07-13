"use client";

import { useEffect, useRef, useState } from "react";
import { Btn } from "@/components/Btn";
import { HanziScreenHeader } from "./HanziScreenHeader";
import type { IdiomLesson } from "@/content/hanzi";
import { speakChunks, type SpeechController } from "@/lib/speech";

export function HanziIdiomLesson({
  lesson,
  onBack,
  onExplained,
  onAnswer,
  onComplete,
}: {
  lesson: IdiomLesson;
  onBack: () => void;
  onExplained: () => void;
  onAnswer: (correct: boolean) => void;
  onComplete: () => void;
}) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const speechRef = useRef<SpeechController | null>(null);
  const quiz = lesson.quiz[quizIndex];
  const choices = quiz
    ? "choices" in quiz
      ? quiz.choices
      : [quiz.answer, ...lesson.keyChars.filter((char) => !quiz.answer.includes(char))].slice(0, 3)
    : [];

  const speak = (text: string) => {
    speechRef.current?.stop();
    speechRef.current = speakChunks(text, { lang: "zh-CN", rate: 0.9 });
  };

  useEffect(() => {
    return () => {
      speechRef.current?.stop();
      speechRef.current = null;
    };
  }, []);

  useEffect(() => {
    speechRef.current?.stop();
    speechRef.current = null;
    setQuizIndex(0);
    setSelected(null);
    setFeedback(null);
  }, [lesson.id]);

  const narrateQuiz = () => {
    if (!quiz || choices.length === 0) return;
    const optionText = choices
      .map((choice, index) => `选项 ${String.fromCharCode(65 + index)}，${choice}。`)
      .join("");
    speak(`${quiz.prompt}。${optionText}`);
  };

  const answerQuiz = (choice: string) => {
    speechRef.current?.stop();
    speechRef.current = null;
    setSelected(choice);
    if (!quiz) return;
    if (choice === quiz.answer) {
      onAnswer(true);
      setFeedback("答对啦，学习记录已更新 🌟");
    } else {
      onAnswer(false);
      setFeedback(`再想一想，正确答案是“${quiz.answer}”`);
    }
  };

  const nextQuiz = () => {
    setSelected(null);
    setFeedback(null);
    if (quizIndex + 1 >= lesson.quiz.length) onComplete();
    else setQuizIndex((index) => index + 1);
  };

  return (
    <section className="h-[min(94vh,64rem)] space-y-5 overflow-y-auto bg-[#fffdf9] p-4 sm:p-6">
      <HanziScreenHeader title={lesson.idiom} subtitle="成语学习" onBack={onBack} progress={`${quizIndex + 1}/${lesson.quiz.length}`} />
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
      <div className="rounded-[1.75rem] bg-purple-50 p-5 ring-1 ring-purple-100">
        <div className="text-sm font-black text-purple-500">成语典故</div>
        <h3 className="mt-1 text-4xl font-black text-slate-800">{lesson.idiom}</h3>
        <div className="mt-1 text-lg font-black text-pink-500">{lesson.pinyin}</div>
        <p className="mt-4 text-sm font-bold leading-7 text-slate-600">{lesson.meaning}</p>
        <p className="mt-3 rounded-2xl bg-white p-4 text-sm font-bold leading-7 text-slate-600 ring-1 ring-purple-100">
          {lesson.story}
        </p>
        <p className="mt-3 text-sm font-bold text-slate-500">例句：{lesson.example}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn size="sm" variant="secondary" onClick={() => {
            setFeedback("典故听过啦，学习记录已更新 ✓");
            speak(lesson.story);
          }}>
            看典故
          </Btn>
          <Btn size="sm" onClick={() => {
            speechRef.current?.stop();
            speechRef.current = null;
            onExplained();
            setFeedback("太棒了！已经记下“我讲完了” ✓");
          }}>
            我讲完了
          </Btn>
        </div>
        {feedback ? (
          <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
            {feedback}
          </p>
        ) : null}
      </div>

      {quiz && choices.length > 0 ? (
        <div className="rounded-[1.75rem] bg-white p-5 shadow ring-1 ring-slate-100">
          <div className="flex items-center justify-between gap-3">
            <div className="font-black text-slate-800">做小测 · {quizIndex + 1}/{lesson.quiz.length}</div>
            <button
              type="button"
              onClick={narrateQuiz}
              aria-label="播报题目和选项"
              className="rounded-xl bg-purple-50 px-3 py-2 text-sm font-black text-purple-600 ring-1 ring-purple-200"
            >
              🔊 播报题目和选项
            </button>
          </div>
          <p className="mt-2 text-sm font-bold text-slate-500">{quiz.prompt}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {choices.map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => answerQuiz(choice)}
                disabled={selected !== null}
                className={`rounded-2xl px-4 py-3 text-sm font-black ring-2 ${
                  selected === choice && choice === quiz.answer
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : selected === choice
                      ? "bg-rose-50 text-rose-600 ring-rose-200"
                    : "bg-slate-50 text-slate-700 ring-slate-100"
                }`}
              >
                {choice}
              </button>
            ))}
          </div>
          {selected ? (
            <div className="mt-4 text-right">
              <Btn size="sm" onClick={nextQuiz}>
                {quizIndex + 1 >= lesson.quiz.length ? "学习下一个成语 →" : "下一题 →"}
              </Btn>
            </div>
          ) : null}
        </div>
      ) : quizIndex >= lesson.quiz.length ? (
        <div className="rounded-3xl bg-emerald-50 p-5 text-center font-black text-emerald-700 ring-1 ring-emerald-100">
          全部题目完成啦！🌟
        </div>
      ) : null}
      </div>

      <div className="flex justify-center">
        <Btn variant="ghost" onClick={onBack}>
          回到汉字探险岛
        </Btn>
      </div>
    </section>
  );
}
