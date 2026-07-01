// 人物详情弹窗：核心人物给富卡（一句话/名场面/互动问），彩蛋人物给图鉴简介。
// 立绘可点开看原图大图（lightbox），不再只是缩略图。
"use client";
import { useState } from "react";
import { GameModal } from "@/components/GameModal";
import type { Person } from "@/content/history/three-kingdoms-detail";
import { TK } from "./theme";

const SERIF = "var(--font-history), 'Noto Serif SC', serif";
const FACTION_NAME: Record<Person["faction"], string> = { shu: "蜀汉", wei: "魏国", wu: "东吴", qun: "群雄" };

export function CharacterModal({
  person,
  factionColor,
  known,
  onClose,
}: {
  person: Person;
  factionColor: string;
  known: boolean;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(false);
  return (
    <>
    <GameModal title={person.name} emoji="🎴" color={factionColor} onClose={onClose}>
      <div className="overflow-y-auto p-4 sm:p-6" style={{ background: TK.parchment }}>
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* 立绘：点开看原图大图 */}
          <div className="mx-auto w-full max-w-[220px] shrink-0 sm:mx-0">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block w-full cursor-zoom-in"
              aria-label={`查看${person.name}立绘大图`}
            >
              <img
                src={person.img}
                alt={person.name}
                className="w-full rounded-2xl"
                style={{ border: `3px solid ${known ? TK.gold : factionColor}`, boxShadow: "0 8px 20px rgba(0,0,0,.35)" }}
              />
              <span
                className="absolute bottom-2 right-2 rounded-full px-2 py-0.5 text-xs font-bold text-white opacity-90"
                style={{ background: "rgba(0,0,0,.55)" }}
              >
                🔍 看大图
              </span>
            </button>
          </div>
          {/* 文字 */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 text-sm font-bold text-white"
                style={{ background: factionColor }}
              >
                {FACTION_NAME[person.faction]}
              </span>
              {known && (
                <span className="rounded-full px-3 py-1 text-sm font-bold text-white" style={{ background: TK.gold }}>
                  ✦ 已了解
                </span>
              )}
            </div>
            <p className="mt-2 text-lg font-bold" style={{ color: TK.ink, fontFamily: SERIF }}>
              {person.role}
            </p>
            {person.kidSummary && (
              <p className="mt-2 leading-relaxed" style={{ color: TK.ink }}>
                {person.kidSummary}
              </p>
            )}

            {person.stories && person.stories.length > 0 && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-bold" style={{ color: TK.goldDeep }}>📜 名场面</div>
                <div className="flex flex-wrap gap-2">
                  {person.stories.map((s) => (
                    <span
                      key={s}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{ background: "rgba(201,162,75,.18)", color: TK.ink, border: `1px solid ${TK.gold}66` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {person.interact && (
              <div
                className="mt-4 rounded-2xl p-3"
                style={{ background: "rgba(46,139,107,.12)", border: `1px dashed ${factionColor}` }}
              >
                <div className="mb-1 text-sm font-bold" style={{ color: factionColor }}>💭 想一想</div>
                <p className="text-sm" style={{ color: TK.ink }}>{person.interact}</p>
              </div>
            )}

            {!person.core && (
              <p className="mt-4 text-sm" style={{ color: "rgba(43,38,34,.6)" }}>
                这是三国群英谱里的一位人物，更多故事敬请期待～
              </p>
            )}
          </div>
        </div>
      </div>
    </GameModal>

      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-label={`${person.name}立绘大图`}
        >
          <img
            src={person.img}
            alt={person.name}
            className="max-h-full max-w-full rounded-2xl object-contain"
            style={{ border: `3px solid ${TK.gold}`, boxShadow: "0 12px 40px rgba(0,0,0,.6)" }}
          />
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="关闭大图"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-xl font-bold text-slate-700 shadow-lg"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
