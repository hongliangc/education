"use client";

import { useEffect, useRef, useState } from "react";
import { GameModal } from "@/components/GameModal";
import { Btn } from "@/components/Btn";
import { FairySprite, type FairyMood } from "@/components/fairy/FairySprite";
import {
  speakTextStream,
  stopSpeaking,
  primeSpeechOutput,
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

function microphonePreflightMessage(): string | null {
  if (!window.isSecureContext) {
    return "当前不是安全连接，需要 https 才能使用麦克风，已切到打字。";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "这个浏览器暂不支持麦克风，已切到打字。";
  }
  return null;
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "";
}

export function FairyChat({
  child,
  onClose,
  context,
  suggestions,
  opening,
}: {
  child: { name: string; age?: number; totalStars?: number };
  onClose: () => void;
  context?: string; // 当前名句/寓言原文+解读，传给后端接地作答；不传时行为不变
  suggestions?: string[]; // 起步问题气泡，给还不会提问的小小孩搭梯子
  opening?: string; // 传入则一打开就让精灵先主动讲一遍（如「语句解读」），不显示用户气泡；之后照常语音追问
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [messages, setMessages] = useState<Turn[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [voiceHint, setVoiceHint] = useState<string | null>(null);
  const holdSessionRef = useRef<ReturnType<typeof createHoldToTalkSession> | null>(null);
  const speakRef = useRef<SpeechController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedRef = useRef(false);
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

  // 一轮问答（语音 / 打字共用）：带最近 N 条历史。
  // opts.silent：把 question 当作给精灵的指令发出去，但不渲染「用户提问」气泡（用于「语句解读」开场自动讲解）。
  const ask = async (question: string, opts?: { silent?: boolean }) => {
    const q = question.trim();
    if (!q) return;
    const history = messages.slice(-HISTORY_TURNS);
    if (!opts?.silent) {
      setMessages((m) => [...m, { role: "user", content: q }]);
    }
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
          context, // undefined 时 JSON.stringify 自动省略，旧调用不受影响
        }),
      });
      const { reply } = await res.json();
      // ?? 不拦空串：reply 为 "" 时会渲染空气泡（多轮空回复的前端表象）。
      // 这里兜底成友好提示，配合后端「空内容按失败」双重防护。
      const text = String(reply ?? "").trim() || "我想想哦，等下再问我一次好吗？✨";
      setMessages((m) => [...m, { role: "fairy", content: text }]);
      setStatus("speaking");
      // 单条连续流式：回复文本每次唯一、永不命中缓存，分段会在每个段边界各等一次实时合成 → 段间卡顿。
      // 整段一次 WS 合成 + MSE 渐进边收边播：未命中延迟只在最开头付一次，之后无段边界、中途无 gap。
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
    // 趁按下这一手势「点亮」朗读输出，iOS Safari 才允许稍后异步出声（精灵回复）。
    primeSpeechOutput();
    if (status === "listening" || status === "thinking") return;
    speakRef.current?.stop();
    stopSpeaking();
    recordingAudio.interrupt();
    setVoiceHint(null);
    const preflightMessage = microphonePreflightMessage();
    if (preflightMessage) {
      console.warn("Fairy voice input unavailable:", preflightMessage);
      recordingAudio.restore();
      setVoiceHint(preflightMessage);
      setTyping(true);
      setStatus("idle");
      return;
    }
    try {
      const listening = await holdSessionRef.current!.begin();
      if (!listening) return;
      setStatus("listening");
    } catch (error) {
      console.warn("Fairy voice input failed:", error);
      recordingAudio.restore();
      const name = errorName(error);
      if (name === "NotAllowedError" || name === "SecurityError") {
        setVoiceHint("请在地址栏允许麦克风后重试。");
        setTyping(false);
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setVoiceHint("没找到麦克风，已切到打字。");
        setTyping(true);
      } else {
        setVoiceHint("麦克风暂时用不了，已切到打字。");
        setTyping(true);
      }
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
    primeSpeechOutput(); // 同上：手势内点亮朗读，回复才出声
    const q = draft;
    setDraft("");
    void ask(q);
  };

  // 「语句解读」：打开即让精灵先主动讲一遍这句（带上下文/典故），之后照常语音追问。只触发一次。
  useEffect(() => {
    if (opening && !openedRef.current) {
      openedRef.current = true;
      void ask(opening, { silent: true });
    }
    // 仅在挂载时跑一次：每次打开都是新挂载（按句打开/关闭），ask 闭包此时已就绪。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="min-h-5 text-center text-sm text-slate-500">
          {voiceHint ?? HINT[status]}
        </div>

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
                    primeSpeechOutput();
                    speakRef.current?.stop();
                    speakRef.current = speakTextStream(m.content, { lang: "zh-CN" });
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

        {messages.length === 0 && suggestions && suggestions.length > 0 && (
          <div className="w-full flex flex-wrap justify-center gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => {
                  primeSpeechOutput();
                  void ask(s);
                }}
                disabled={status === "thinking"}
                className="rounded-full bg-pink-50 ring-1 ring-pink-200 px-3 py-1.5 text-sm text-pink-600 transition hover:bg-pink-100 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}

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
