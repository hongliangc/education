"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { KingdomBG } from "@/components/KingdomBG";
import { CardSkeleton } from "@/components/skeleton/CardSkeleton";
import { useGameStore, type ChildSummary } from "@/store/gameStore";
import { isGrade } from "@/lib/grades";
import { useVisualQa } from "@/lib/visual-qa";
import { VisualChildSelect } from "@/components/visual-qa/VisualChildSelect";
import { CreateChildModal, GradeConfirmModal } from "@/components/child/ChildSelectModals";

export default function ChildSelectPage() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmChild, setConfirmChild] = useState<ChildSummary | null>(null);
  const setActiveChild = useGameStore((s) => s.setActiveChild);
  const visualQa = useVisualQa();

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

  const enterWorld = (c: ChildSummary) => {
    setActiveChild(c);
    router.push("/world");
  };

  const pick = (c: ChildSummary) => {
    // Confirm the grade once before the first adventure; afterwards go straight in.
    if (isGrade(c.gradeLevel)) {
      enterWorld(c);
    } else {
      setConfirmChild(c);
    }
  };

  return (
    <>
      <KingdomBG priority />
      <main className="relative z-10 min-h-screen px-5 py-10 flex flex-col items-center">
        {!visualQa && (
          <div className="storybook-paper mb-6 rounded-[2rem] px-8 py-4 text-center anim-slide-up">
            <h1 className="text-3xl font-black text-rose-500 drop-shadow-sm sm:text-4xl">
              ⭐ 选择小冒险家 ⭐
            </h1>
            <p className="mt-1 text-sm font-bold text-amber-700">谁来开始今天的旅程？</p>
          </div>
        )}

        {visualQa ? (
          <VisualChildSelect
            children={children}
            onPick={pick}
            onAdd={() => setShowCreate(true)}
          />
        ) : loading ? <CardSkeleton count={3} /> : null}

        {!visualQa && !loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl">
            {children.map((c, i) => (
              <button
                key={c.id}
                onClick={() => pick(c)}
                className="storybook-paper anim-pop-in overflow-hidden rounded-3xl p-4 transition hover:scale-105 active:scale-95"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                <Image
                  src="/ui/characters/child-explorer-v1.png"
                  alt=""
                  width={240}
                  height={260}
                  className="mx-auto h-36 w-full object-contain"
                />
                <div className="font-bold text-lg text-slate-700">{c.name}</div>
                <div className="text-sm text-slate-500">{c.age} 岁 · Lv.{c.fairyLevel}</div>
                <div className="mt-2 flex items-center justify-center gap-3 text-sm text-amber-600"><span>{c.avatar}</span><span>⭐ {c.totalStars}</span></div>
              </button>
            ))}

            <button
              onClick={() => setShowCreate(true)}
              className="storybook-paper anim-pop-in rounded-3xl p-5 text-blue-600 transition hover:scale-105"
              style={{ animationDelay: `${children.length * 0.07}s` }}
            >
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-sky-400 to-blue-600 text-6xl text-white shadow-lg">＋</div>
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

        {confirmChild && (
          <GradeConfirmModal
            child={confirmChild}
            onClose={() => setConfirmChild(null)}
            onConfirmed={(c) => {
              setChildren((arr) => arr.map((x) => (x.id === c.id ? c : x)));
              setConfirmChild(null);
              enterWorld(c);
            }}
          />
        )}
      </main>
    </>
  );
}
