"use client";

import { useEffect, useRef, useState } from "react";
import { GameModal } from "@/components/GameModal";
import { Btn } from "@/components/Btn";
import { FairySprite, type FairyMood } from "@/components/fairy/FairySprite";
import {
  speakText,
  speakTextStream,
  stopSpeaking,
  createRecorder,
  recognizeBlob,
  type SpeechController,
} from "@/lib/speech";
import { createHoldToTalkSession } from "./holdToTalk";
import { useRecordingAudioGuard } from "./useRecordingAudioGuard";

type Status = "idle" | "listening" | "thinking" | "speaking";
type Turn = { role: "user" | "fairy"; content: string };

const MOOD: Record<Status, FairyMood> = {
  idle: "happy",
  listening: "surprised",
  thinking: "thinking",
  speaking: "excited",
};
const HINT: Record<Status, string> = {
  idle: "点住下面的按钮跟我说话吧～",
  listening: "我在听… 🎤",
  thinking: "让我想想… 🤔",
  speaking: "我来回答你～ ✨",
};

const HISTORY_TURNS = 6; // 最近 6 条 = 3 轮

export function FairyChat({
  child,
  onClose,
}: {
  child: { name: string; age?: number; totalStars?: number };
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Turn[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const holdSessionRef = useRef<ReturnType<typeof createHoldToTalkSession> | null>(null);
  const speakRef = useRef<SpeechController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recordingAudio = useRecordingAudioGuard();
  holdSessionRef.current ??= createHoldToTalkSession(createRecorder);

  // 新消息 / 状态变化时滚到底
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, status]);

  // 关闭即清场（停录音 + 停朗读）
  useEffect(() => {
    return () => {
      holdSessionRef.current?.cancel();
      speakRef.current?.stop();
      stopSpeaking();
    };
  }, []);

  // 一轮问答（语音 / 打字共用）：带最近 N 条历史
  const ask = async (question: string) => {
    const q = question.trim();
    if (!q) return;
    const history = messages.slice(-HISTORY_TURNS);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setStatus("thinking");
    try {
      const res = await fetch("/api/fairy/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: q,
          history,
          childName: child.name,
          age: child.age,
          stars: child.totalStars,
        }),
      });
      const { reply } = await res.json();
      // ?? 不拦空串：reply 为 "" 时会渲染空气泡（多轮空回复的前端表象）。
      // 这里兜底成友好提示，配合后端「空内容按失败」双重防护。
      const text = String(reply ?? "").trim() || "我想想哦，等下再问我一次好吗？✨";
      setMessages((m) => [...m, { role: "fairy", content: text }]);
      setStatus("speaking");
      // 流式朗读：首声 ~1s（整段约 4.7s）；失败自动回退整段/Web Speech
      speakRef.current = speakTextStream(text, {
        lang: "zh-CN",
        onEnd: () => setStatus("idle"),
      });
    } catch {
      setMessages((m) => [
        ...m,
        { role: "fairy", content: "哎呀我开小差了，再试一次好吗？" },
      ]);
      setStatus("idle");
    }
  };

  // 按住说话：按下。允许在「说话中」直接打断并开始录音（避免万一卡在 speaking 时锁死入口）；
  // 仅在 listening / thinking 时忽略，防止重复录音或抢答。
  const startTalk = async () => {
    if (status === "listening" || status === "thinking") return;
    speakRef.current?.stop();
    stopSpeaking();
    recordingAudio.interrupt();
    try {
      const listening = await holdSessionRef.current!.begin();
      if (!listening) return;
      setStatus("listening");
    } catch {
      recordingAudio.restore();
      // 无麦克风权限 → 自动切打字
      setTyping(true);
      setStatus("idle");
    }
  };

  // 按住说话：松手
  const endTalk = async () => {
    try {
      const blob = await holdSessionRef.current!.end();
      if (!blob) return;
      setStatus("thinking");
      const text = await recognizeBlob(blob, { lang: "zh-CN" });
      recordingAudio.restore();
      if (!text.trim()) {
        setMessages((m) => [
          ...m,
          { role: "fairy", content: "没听清，再说一遍好吗？" },
        ]);
        setStatus("idle");
        return;
      }
      await ask(text);
    } catch {
      setStatus("idle");
    } finally {
      recordingAudio.restore();
    }
  };

  const submitTyped = () => {
    const q = draft;
    setDraft("");
    void ask(q);
  };

  // 朗读时点精灵可打断
  const interrupt = () => {
    if (status === "speaking") {
      speakRef.current?.stop();
      setStatus("idle");
    }
  };

  return (
    <GameModal title="和精灵聊天" emoji="🧚" color="#f472b6" onClose={onClose}>
      <div className="flex flex-col items-center gap-3">
        <div onClick={interrupt} className="cursor-pointer">
          <FairySprite mood={MOOD[status]} size={120} />
        </div>
        <div className="text-sm text-slate-500 h-5">{HINT[status]}</div>

        <div
          ref={scrollRef}
          className="w-full max-h-[40vh] overflow-y-auto scroll-hide flex flex-col gap-2 px-1"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                m.role === "user"
                  ? "self-end bg-sky-100 text-slate-700"
                  : "self-start bg-pink-100 text-slate-700"
              }`}
            >
              <span className="mr-1">{m.role === "user" ? "🧒" : "🧚"}</span>
              {m.content}
              {m.role === "fairy" && (
                <button
                  onClick={() => {
                    speakRef.current?.stop();
                    speakRef.current = speakText(m.content, { lang: "zh-CN" });
                  }}
                  className="ml-1 text-pink-400 hover:text-pink-600"
                  aria-label="重听"
                >
                  ▶
                </button>
              )}
            </div>
          ))}
        </div>

        {typing ? (
          <div className="w-full flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitTyped()}
              placeholder="打字问精灵…"
              className="flex-1 rounded-2xl ring-1 ring-slate-200 px-3 py-2 text-sm"
              aria-label="打字提问"
            />
            <Btn size="sm" onClick={submitTyped} disabled={status === "thinking"}>
              发送
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setTyping(false)}
              ariaLabel="切回语音"
            >
              🎤
            </Btn>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center gap-2">
            <button
              onPointerDown={startTalk}
              onPointerUp={endTalk}
              onPointerLeave={endTalk}
              disabled={status === "thinking"}
              className={`select-none touch-none rounded-full w-44 h-16 font-bold text-white text-lg shadow-lg transition active:scale-95 disabled:opacity-50 ${
                status === "listening" ? "bg-rose-500 animate-pulse" : "bg-pink-500"
              }`}
              aria-label="按住说话"
            >
              🎤 {status === "listening" ? "松开发送" : "按住说话"}
            </button>
            <Btn
              size="sm"
              variant="ghost"
              onClick={() => setTyping(true)}
              ariaLabel="切到打字"
            >
              ⌨️ 打字
            </Btn>
          </div>
        )}
      </div>
    </GameModal>
  );
}
