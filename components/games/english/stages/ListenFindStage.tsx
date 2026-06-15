"use client";

import { useEffect, useRef, useState } from "react";
import { speakText, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { buildListenChoices, type EnglishScene, type EnglishWord } from "@/content/english/scene";

// Step ② 听音点图 — hear "Find the banana!", tap the matching picture. Wrong taps shake and let the
// child try again (never a dead end); a first-try hit counts toward the stars. Reports good/total.
export function ListenFindStage({
  scene,
  onDone,
}: {
  scene: EnglishScene;
  onDone: (score: { good: number; total: number }) => void;
}) {
  const order = scene.words;
  const [qi, setQi] = useState(0);
  const [missed, setMissed] = useState(false);
  const [good, setGood] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [choices] = useState<EnglishWord[][]>(() =>
    order.map((w) => buildListenChoices(scene, w.id)),
  );
  const answer = order[qi];
  const speakRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  const say = () => {
    speakRef.current?.stop();
    speakRef.current = speakText(`Find the ${answer.en}.`, { lang: "en-US", rate: 0.85 });
  };

  useEffect(() => {
    say();
    setMissed(false);
    setWrongId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi]);

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  const pick = (id: string) => {
    if (id === answer.id) {
      sfx.correct();
      const nextGood = good + (missed ? 0 : 1);
      setGood(nextGood);
      setWrongId(null);
      setTimeout(() => {
        if (qi + 1 >= order.length) onDone({ good: nextGood, total: order.length });
        else setQi((n) => n + 1);
      }, 600);
    } else {
      sfx.wrong();
      setMissed(true);
      setWrongId(id);
    }
  };

  return (
    <div className="text-center">
      <p className="text-sm font-bold text-emerald-500">② 听音点图 · Listen &amp; find</p>
      <button
        type="button"
        onClick={say}
        className="mt-3 rounded-full bg-sky-100 px-4 py-2 text-base font-bold text-sky-600 ring-2 ring-sky-200 hover:bg-sky-200"
        aria-label="再听一次"
      >
        🔊 再听一次
      </button>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {choices[qi].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => pick(c.id)}
            className={`rounded-2xl py-7 text-6xl shadow ring-2 transition active:scale-95 ${
              wrongId === c.id
                ? "anim-shake bg-rose-50 ring-rose-300"
                : "bg-white ring-emerald-100 hover:bg-emerald-50"
            }`}
            aria-label={c.en}
          >
            {c.emoji}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        第 {qi + 1} / {order.length}
      </p>
    </div>
  );
}
