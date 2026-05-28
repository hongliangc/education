"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { CloudBG } from "@/components/CloudBG";
import { Btn } from "@/components/Btn";
import { useGameStore, type ChildSummary } from "@/store/gameStore";

const AVATARS = ["🌸", "🐯", "🦄", "🐰", "🦊", "🐼", "🐧", "🦁", "🐸", "🐢"];

export default function ChildSelectPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const setActiveChild = useGameStore((s) => s.setActiveChild);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/children");
      if (res.ok) {
        const j = await res.json();
        setChildren(j.children ?? []);
        if (!j.children?.length) setShowCreate(true);
      }
      setLoading(false);
    })();
  }, []);

  const pick = (c: ChildSummary) => {
    setActiveChild(c);
    router.push("/world");
  };

  return (
    <>
      <CloudBG />
      <main className="min-h-screen px-5 py-10 flex flex-col items-center">
        <div className="text-center mb-6 anim-slide-up">
          <div className="text-7xl anim-float inline-block">🧚</div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mt-2">
            选择小冒险家
          </h1>
          <p className="text-white/90 mt-1">谁来开始今天的旅程？</p>
        </div>

        {loading && <p className="text-white/80">加载中…</p>}

        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {children.map((c, i) => (
              <button
                key={c.id}
                onClick={() => pick(c)}
                className="anim-pop-in rounded-3xl bg-white/85 backdrop-blur p-5 shadow-xl ring-1 ring-white/40 hover:scale-105 transition active:scale-95"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <div className="text-6xl mb-2">{c.avatar}</div>
                <div className="font-bold text-lg text-slate-700">{c.name}</div>
                <div className="text-sm text-slate-500">{c.age} 岁 · Lv.{c.fairyLevel}</div>
                <div className="text-sm text-amber-500 mt-1">⭐ {c.totalStars}</div>
              </button>
            ))}

            <button
              onClick={() => setShowCreate(true)}
              className="anim-pop-in rounded-3xl bg-white/30 backdrop-blur p-5 ring-2 ring-dashed ring-white/70 text-white hover:bg-white/50 transition"
              style={{ animationDelay: `${children.length * 0.07}s` }}
            >
              <div className="text-6xl mb-2">＋</div>
              <div className="font-bold">添加小冒险家</div>
            </button>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-8 text-white/70 underline text-sm"
        >
          退出家长账号
        </button>

        {showCreate && (
          <CreateChildModal
            onClose={() => setShowCreate(false)}
            onCreated={(c) => {
              setChildren((arr) => [...arr, c]);
              setShowCreate(false);
            }}
          />
        )}
      </main>
    </>
  );
}

function CreateChildModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: ChildSummary) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(5);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), age, avatar }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "创建失败");
        return;
      }
      const j = await res.json();
      onCreated(j.child as ChildSummary);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="anim-pop-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-slate-700 mb-4">新建小冒险家</h2>

        <label className="block mb-3">
          <span className="text-sm text-slate-600">名字</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：小明"
            className="mt-1 w-full rounded-xl border-2 border-pink-200 px-4 py-3 outline-none focus:border-pink-400"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm text-slate-600">年龄：{age} 岁</span>
          <input
            type="range"
            min={3}
            max={12}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="mb-4">
          <span className="text-sm text-slate-600">选个头像</span>
          <div className="grid grid-cols-5 gap-2 mt-2">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className={`text-3xl p-2 rounded-2xl ring-2 transition ${
                  avatar === a
                    ? "ring-pink-400 bg-pink-50 scale-110"
                    : "ring-transparent hover:bg-slate-50"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-rose-500 text-sm mb-2">⚠ {error}</p>}

        <div className="flex gap-3">
          <Btn variant="ghost" onClick={onClose} className="flex-1">
            取消
          </Btn>
          <Btn type="submit" variant="primary" disabled={pending} className="flex-1">
            {pending ? "创建中…" : "完成 ✨"}
          </Btn>
        </div>
      </form>
    </div>
  );
}
