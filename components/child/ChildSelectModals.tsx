"use client";

import { useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { Btn } from "@/components/Btn";
import type { ChildSummary } from "@/store/gameStore";
import { GRADE_LABELS, GRADES, inferGradeFromAge, type Grade } from "@/lib/grades";

const AVATARS = ["🌸", "🐯", "🦄", "🐰", "🦊", "🐼", "🐧", "🦁", "🐸", "🐢"];

export function GradeConfirmModal({ child, onClose, onConfirmed }: { child: ChildSummary; onClose: () => void; onConfirmed: (child: ChildSummary) => void }) {
  const [grade, setGrade] = useState<Grade>(inferGradeFromAge(child.age));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const confirm = () => start(async () => {
    const res = await fetch(`/api/children/${child.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ gradeLevel: grade }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存失败");
      return;
    }
    const data = await res.json();
    onConfirmed(data.child as ChildSummary);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="anim-pop-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-1 text-2xl font-bold text-slate-700">{child.name} 上几年级啦？</h2>
        <p className="mb-4 text-sm text-slate-500">我们会按年级准备合适的内容，之后可以随时调整。</p>
        <div className="mb-4 grid grid-cols-3 gap-2">
          {GRADES.map((item) => <button key={item} type="button" onClick={() => setGrade(item)} className={`rounded-2xl px-2 py-3 text-center ring-2 transition ${grade === item ? "scale-105 bg-pink-50 ring-pink-400" : "ring-slate-200 hover:bg-slate-50"}`}><div className="font-bold text-slate-700">{item}</div><div className="text-xs text-slate-500">{GRADE_LABELS[item]}</div></button>)}
        </div>
        {error && <p className="mb-2 text-sm text-rose-500">⚠ {error}</p>}
        <div className="flex gap-3"><Btn variant="ghost" onClick={onClose} className="flex-1">取消</Btn><Btn variant="primary" onClick={confirm} disabled={pending} className="flex-1">{pending ? "保存中…" : "开始冒险 ✨"}</Btn></div>
      </div>
    </div>
  );
}

export function CreateChildModal({ onClose, onCreated }: { onClose: () => void; onCreated: (child: ChildSummary) => void }) {
  const [name, setName] = useState("");
  const [age, setAge] = useState(5);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    start(async () => {
      const res = await fetch("/api/children", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim(), age, avatar }) });
      if (!res.ok) {
        if (res.status === 401) {
          await signOut({ callbackUrl: "/login" });
          return;
        }
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "创建失败");
        return;
      }
      const data = await res.json();
      onCreated(data.child as ChildSummary);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <form onSubmit={submit} className="anim-pop-in w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-2xl font-bold text-slate-700">新建小冒险家</h2>
        <label className="mb-3 block"><span className="text-sm text-slate-600">名字</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：小明" className="mt-1 w-full rounded-xl border-2 border-pink-200 px-4 py-3 outline-none focus:border-pink-400" /></label>
        <label className="mb-3 block"><span className="text-sm text-slate-600">年龄：{age} 岁</span><input type="range" min={3} max={12} value={age} onChange={(event) => setAge(Number(event.target.value))} className="w-full" /></label>
        <div className="mb-4"><span className="text-sm text-slate-600">选个头像</span><div className="mt-2 grid grid-cols-5 gap-2">{AVATARS.map((item) => <button key={item} type="button" onClick={() => setAvatar(item)} className={`rounded-2xl p-2 text-3xl ring-2 transition ${avatar === item ? "scale-110 bg-pink-50 ring-pink-400" : "ring-transparent hover:bg-slate-50"}`}>{item}</button>)}</div></div>
        {error && <p className="mb-2 text-sm text-rose-500">⚠ {error}</p>}
        <div className="flex gap-3"><Btn variant="ghost" onClick={onClose} className="flex-1">取消</Btn><Btn type="submit" variant="primary" disabled={pending} className="flex-1">{pending ? "创建中…" : "完成 ✨"}</Btn></div>
      </form>
    </div>
  );
}
