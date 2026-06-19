"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { EnglishScene } from "@/components/games/english/EnglishScene";
import { ENGLISH_SCENES } from "@/content/english/scene";
import { AlphabetCategory } from "./alphabet/AlphabetCategory";
import { IpaCategory } from "./ipa/IpaCategory";

type MainCategory = "scene" | "sounds";
type SoundCategory = "alphabet" | "ipa";

export function EnglishHub() {
  const router = useRouter();
  const [mainCategory, setMainCategory] = useState<MainCategory>("scene");
  const [soundCategory, setSoundCategory] = useState<SoundCategory>("alphabet");
  const [sceneId, setSceneId] = useState(ENGLISH_SCENES[0].id);
  const [runKey, setRunKey] = useState(0);
  const scene = ENGLISH_SCENES.find((item) => item.id === sceneId) ?? ENGLISH_SCENES[0];

  return (
    <main className="mx-auto min-h-full w-full px-4 py-8 font-[family-name:var(--font-kid)]">
      <div className="mx-auto max-w-md">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <BackButton label="返回世界" onClick={() => router.push("/world")} />
          <div>
            <p className="text-sm font-bold tracking-wide text-purple-500">魔法学习王国 · 英语岛</p>
            <h1 className="mt-1 text-2xl font-black text-slate-800">听一听，大胆开口说</h1>
            <p className="mt-2 text-sm text-slate-500">从字母和音标出发，再到真实场景里开口交流。</p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-2 rounded-3xl bg-white/70 p-2 shadow-sm ring-1 ring-slate-100">
          <CategoryButton
            active={mainCategory === "scene"}
            onClick={() => setMainCategory("scene")}
            activeClass="bg-emerald-500"
          >
            🛒 场景闯关
          </CategoryButton>
          <CategoryButton
            active={mainCategory === "sounds"}
            onClick={() => setMainCategory("sounds")}
            activeClass="bg-purple-500"
          >
            🔤 字母 & 音标
          </CategoryButton>
        </div>

        {mainCategory === "sounds" ? (
          <div className="mt-3 flex justify-center gap-2">
            <SubcategoryButton
              active={soundCategory === "alphabet"}
              onClick={() => setSoundCategory("alphabet")}
            >
              26 字母
            </SubcategoryButton>
            <SubcategoryButton
              active={soundCategory === "ipa"}
              onClick={() => setSoundCategory("ipa")}
            >
              国际音标
            </SubcategoryButton>
          </div>
        ) : null}

        {mainCategory === "scene" && ENGLISH_SCENES.length > 1 ? (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {ENGLISH_SCENES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSceneId(item.id);
                  setRunKey((key) => key + 1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-black shadow-sm transition-colors ${
                  item.id === sceneId
                    ? "bg-emerald-500 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-emerald-50"
                }`}
              >
                {item.icon} {item.title}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className={`mx-auto mt-5 ${mainCategory === "sounds" ? "max-w-5xl" : "max-w-md"}`}>
        <div className="rounded-3xl bg-white/60 p-4 shadow-sm ring-1 ring-slate-100">
          {mainCategory === "scene" ? (
            <EnglishScene
              key={runKey}
              scene={scene}
              onExit={() => setRunKey((key) => key + 1)}
            />
          ) : soundCategory === "alphabet" ? (
            <AlphabetCategory />
          ) : (
            <IpaCategory />
          )}
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-md text-center text-xs text-slate-400">
        没有麦克风也能玩：跟读步骤会自动切到「👍 我说好了」。
      </p>
    </main>
  );
}

function CategoryButton({
  active,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  activeClass: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
        active ? `${activeClass} text-white shadow` : "bg-white text-slate-500 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function SubcategoryButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-5 py-2 text-sm font-black transition ${
        active
          ? "bg-purple-100 text-purple-700 ring-2 ring-purple-300"
          : "bg-white text-slate-500 ring-1 ring-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
