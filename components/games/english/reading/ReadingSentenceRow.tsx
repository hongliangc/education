"use client";

import { useEffect, useRef, useState } from "react";
import { speakEnglishClip, stopSpeaking, type SpeechController } from "@/lib/speech";
import { useSFX } from "@/components/audio/useSFX";
import { gradeAttempt } from "@/content/english/encourage";
import { matchSpokenSentence } from "@/lib/reading/match";
import type { ReadingSentence } from "@/content/reading/types";
import { SpeakPanel } from "../SpeakPanel";

type Feedback = null | "correct" | "retry" | "soft";

// One sentence of a bilingual story: the English line (highlighted while it's being read aloud in
// 通读全文), a 「看中文」 toggle that reveals the translation, and a SpeakPanel for follow-along. The
// SpeakPanel's 🔊 plays THIS sentence's pre-generated Polly clip (via onListen); its 🎤 records the
// child and we judge the transcript with the lenient sentence matcher. Encourage-first (跟读 design):
// a good read celebrates, a miss gets one gentle retry, a second miss soft-passes — and no mic at all
// self-confirms — so the child is never trapped. Once passed, the row locks with a ✓.
export function ReadingSentenceRow({
  sentence,
  index,
  active,
  passed,
  locked,
  rate,
  onPassed,
}: {
  sentence: ReadingSentence;
  index: number;
  active: boolean;
  passed: boolean;
  /** 通读全文 is playing — lock follow-along so the row mic doesn't fight the read-through audio. */
  locked: boolean;
  rate: number;
  onPassed: () => void;
}) {
  const [showZh, setShowZh] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const speakRef = useRef<SpeechController | null>(null);
  const { sfx } = useSFX();

  useEffect(
    () => () => {
      speakRef.current?.stop();
      stopSpeaking();
    },
    [],
  );

  // 🔊 听一遍 plays this sentence's clip (slug-by-text would mangle a long sentence — use the explicit
  // reading path, with browser-voice fallback baked into speakEnglishClip).
  const listen = (): SpeechController => speakEnglishClip(sentence.audio, sentence.en, { rate });

  const onSpoken = (transcript: string | null) => {
    if (passed) return;
    if (transcript === null) {
      // mic blocked → 「👍 我说好了」 self-confirm always passes
      sfx.correct();
      setFb("soft");
      onPassed();
      return;
    }
    const ok = matchSpokenSentence(transcript, sentence.en).passed;
    const attemptNo = attempts + 1;
    const outcome = gradeAttempt(ok, attemptNo);
    if (outcome === "correct") {
      sfx.correct();
      setFb("correct");
      onPassed();
    } else if (outcome === "retry") {
      sfx.wrong();
      setAttempts(attemptNo);
      setFb("retry");
      speakRef.current?.stop();
      speakRef.current = listen(); // model it again, a touch slower
    } else {
      sfx.coin();
      setFb("soft");
      onPassed();
    }
  };

  return (
    <div
      className={`rounded-2xl p-3 ring-1 transition ${
        active
          ? "bg-amber-50 ring-amber-300"
          : passed
            ? "bg-emerald-50/60 ring-emerald-100"
            : "bg-white ring-slate-100"
      }`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-1 w-5 shrink-0 text-right text-xs font-black text-slate-300">
          {index + 1}
        </span>
        <p
          className={`flex-1 text-lg font-bold leading-relaxed ${
            active ? "text-amber-900" : "text-slate-800"
          }`}
        >
          {sentence.en}
          {passed && <span className="ml-1 text-emerald-500">✓</span>}
        </p>
      </div>

      {showZh && <p className="mt-1 pl-7 text-sm leading-relaxed text-slate-500">{sentence.zh}</p>}

      <div className="mt-2 flex items-center justify-between pl-7">
        <button
          type="button"
          onClick={() => setShowZh((v) => !v)}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500 transition hover:bg-slate-200"
        >
          {showZh ? "🙈 收起中文" : "🇨🇳 看中文"}
        </button>
        <span className="h-5 text-sm font-bold">
          {fb === "correct" && <span className="text-emerald-500">读得真棒！🎉</span>}
          {fb === "retry" && <span className="text-amber-500">再试一次，跟我读～ 🔁</span>}
          {fb === "soft" && <span className="text-sky-500">很好，我们继续！👍</span>}
        </span>
      </div>

      <div className="mt-2">
        <SpeakPanel
          say={sentence.en}
          lang="en-US"
          onListen={listen}
          onSpoken={onSpoken}
          disabled={passed || locked}
        />
      </div>
    </div>
  );
}
