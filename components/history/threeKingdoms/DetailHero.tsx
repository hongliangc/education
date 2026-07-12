// 朝代 Hero：竖匾「三国」+ 一句话 + 关键词 + 开始冒险 CTA + 迷你三国势力地图。
"use client";
import type { DynastyDetail } from "@/content/history/three-kingdoms-detail";
import { TK, TITLE_PLAQUE, MAP_IMG, panelStyle } from "./theme";

const SERIF = "var(--font-history)";

export function DetailHero({
  detail,
  allRead,
  onStartAdventure,
  onOpenMap,
}: {
  detail: DynastyDetail;
  allRead: boolean;
  onStartAdventure: () => void;
  onOpenMap: () => void;
}) {
  return (
    <section
      className="anim-scroll-unfurl grid gap-4 rounded-3xl p-4 sm:grid-cols-[1fr_260px] sm:p-6"
      style={panelStyle}
    >
      {/* 左：标题区 */}
      <div className="flex gap-3">
        <img
          src={TITLE_PLAQUE}
          alt="三国"
          className="hidden h-44 self-start sm:block"
          style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,.3))" }}
        />
        <div className="min-w-0">
          <h1
            className="text-4xl font-black sm:text-5xl"
            style={{ color: TK.ink, fontFamily: SERIF, letterSpacing: "4px" }}
          >
            {detail.name}
          </h1>
          <p className="mt-1 text-sm font-bold" style={{ color: TK.goldDeep }}>
            {detail.time} · 魏、蜀、吴三足鼎立
          </p>
          <p className="mt-2 leading-relaxed" style={{ color: TK.ink }}>
            {detail.introForKids}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detail.keywords.map((k) => (
              <span
                key={k}
                className="rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: "rgba(201,162,75,.2)", color: TK.ink, border: `1px solid ${TK.gold}` }}
              >
                {k}
              </span>
            ))}
          </div>
          <button
            onClick={onStartAdventure}
            className="mt-4 rounded-2xl px-6 py-3 text-lg font-black text-white transition active:translate-y-0.5"
            style={{
              background: `linear-gradient(180deg, ${TK.cinnabar}, #9c281e)`,
              border: `2px solid ${TK.gold}`,
              animation: "ctaPulse 2.4s ease-in-out infinite",
              fontFamily: SERIF,
            }}
          >
            {allRead ? "🏯 重温三国故事" : "🏯 开始三国冒险"}
          </button>
        </div>
      </div>

      {/* 右：迷你地图（真·三国势力图缩略，点看大图） */}
      <button
        onClick={onOpenMap}
        aria-label="查看三国势力地图"
        className="relative min-h-[140px] overflow-hidden rounded-2xl transition hover:brightness-105"
        style={{ border: `2px solid ${TK.gold}`, boxShadow: "0 6px 16px rgba(0,0,0,.3)" }}
      >
        <img src={MAP_IMG} alt="三国势力地图" className="h-full w-full object-cover" />
        <span
          className="absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-xs font-bold text-white"
          style={{ background: "rgba(0,0,0,.55)", fontFamily: SERIF }}
        >
          三国势力图 · 点看地图
        </span>
      </button>
    </section>
  );
}
