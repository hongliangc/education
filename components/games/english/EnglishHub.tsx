"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/BackButton";
import { EnglishScene } from "@/components/games/english/EnglishScene";
import { ENGLISH_SCENES } from "@/content/english/scene";
import { AlphabetCategory } from "./alphabet/AlphabetCategory";
import { IpaCategory } from "./ipa/IpaCategory";
import { ReadingCategory } from "./reading/ReadingCategory";
import { useVisualQa } from "@/lib/visual-qa";
import { VisualEnglishHub } from "@/components/visual-qa/VisualEnglishHub";
import { showFairyGuide } from "@/lib/fairy-guide";

type MainCategory = "scene" | "sounds" | "reading";
type SoundCategory = "alphabet" | "ipa";

export function EnglishHub() {
  const router = useRouter();
  const [mainCategory, setMainCategory] = useState<MainCategory>("sounds");
  const [soundCategory, setSoundCategory] = useState<SoundCategory>("alphabet");
  const [sceneId, setSceneId] = useState(ENGLISH_SCENES[0].id);
  const [runKey, setRunKey] = useState(0);
  const scene = ENGLISH_SCENES.find((item) => item.id === sceneId) ?? ENGLISH_SCENES[0];
  const visualQa = useVisualQa();

  useEffect(() => {
    if (!visualQa) {
      showFairyGuide({
        event: "enter",
        text: "先从 26 个字母开始吧：点一张字母卡，听一听，再跟着读。",
        autoHideMs: 6500,
      });
    }
  }, [visualQa]);

  if (visualQa) return <VisualEnglishHub />;

  return (
    <main className="mx-auto min-h-full w-full px-4 pb-10 pt-20 font-[family-name:var(--font-kid)]">
      <div className="mx-auto max-w-5xl">
        <header className="storybook-paper mb-3 flex items-center gap-3 rounded-[2rem] p-3 backdrop-blur sm:p-4">
          <BackButton label="返回世界" onClick={() => router.push("/world")} />
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Image
              src="/ui/islands/english.webp"
              alt=""
              width={96}
              height={96}
              loading="eager"
              className="h-14 w-14 shrink-0 object-contain drop-shadow-lg sm:h-16 sm:w-16"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-slate-800 sm:text-3xl">英语岛</h1>
              <p className="truncate text-xs text-slate-500 sm:text-sm">从字母和音标出发，大胆开口说。</p>
            </div>
          </div>
        </header>

        <div className="storybook-paper grid grid-cols-3 gap-2 rounded-3xl p-2 backdrop-blur">
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
          <CategoryButton
            active={mainCategory === "reading"}
            onClick={() => setMainCategory("reading")}
            activeClass="bg-sky-500"
          >
            📖 双语阅读
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

      <div
        className={`mx-auto mt-3 ${
          mainCategory === "sounds"
            ? "max-w-5xl"
            : mainCategory === "reading"
              ? "max-w-2xl"
              : "max-w-md"
        }`}
      >
        <div className="storybook-paper rounded-[2rem] p-4 backdrop-blur">
          {mainCategory === "scene" ? (
            <EnglishScene
              key={runKey}
              scene={scene}
              onExit={() => setRunKey((key) => key + 1)}
            />
          ) : mainCategory === "reading" ? (
            <ReadingCategory />
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
      aria-pressed={active}
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
      aria-pressed={active}
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
