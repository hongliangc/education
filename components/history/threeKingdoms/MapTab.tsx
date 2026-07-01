// 地图：整幅三国势力地图（点开看大图）+ 阵营切换 + 该阵营人物（点头像看详情）。
"use client";
import { useState } from "react";
import { THREE_KINGDOMS_DETAIL, type FactionKey, type Person } from "@/content/history/three-kingdoms-detail";
import { CharacterModal } from "./CharacterModal";
import { TK, MAP_IMG, peopleThumb, panelStyle } from "./theme";

const SERIF = "var(--font-history), 'Noto Serif SC', serif";
const { factions, people } = THREE_KINGDOMS_DETAIL;
const colorOf = (k: FactionKey) => factions.find((f) => f.key === k)!.color;

export function MapTab() {
  const [active, setActive] = useState<FactionKey>("shu");
  const [selected, setSelected] = useState<Person | null>(null);
  const [zoom, setZoom] = useState(false);
  const faction = factions.find((f) => f.key === active)!;
  const roster = people.filter((p) => p.faction === active);

  return (
    <div>
      {/* 整幅三国势力地图（点开看大图） */}
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label="查看三国势力地图大图"
        className="group relative mb-3 block w-full cursor-zoom-in overflow-hidden rounded-3xl"
        style={{ border: `2px solid ${TK.gold}`, boxShadow: "0 8px 22px rgba(0,0,0,.35)" }}
      >
        <img src={MAP_IMG} alt="三国势力地图" className="block w-full" />
        <span
          className="absolute bottom-2 right-2 rounded-full px-2.5 py-1 text-xs font-bold text-white opacity-90"
          style={{ background: "rgba(0,0,0,.55)" }}
        >
          🔍 点开看大图
        </span>
      </button>

      {/* 阵营切换 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {factions.map((f) => {
          const on = f.key === active;
          return (
            <button
              key={f.key}
              onClick={() => setActive(f.key)}
              className="rounded-full px-3 py-1.5 text-sm font-bold transition"
              style={{
                background: on ? f.color : "rgba(255,255,255,.55)",
                color: on ? "#fff" : TK.ink,
                border: `1.5px solid ${f.color}`,
                fontFamily: SERIF,
              }}
            >
              {f.name}
            </button>
          );
        })}
      </div>

      {/* 该阵营详情 + 人物 */}
      <div className="rounded-3xl p-4" style={panelStyle}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md px-2.5 py-1 text-base font-black text-white" style={{ background: faction.color, fontFamily: SERIF }}>
            {faction.name}
          </span>
          <span className="text-sm" style={{ color: "rgba(43,38,34,.8)" }}>
            {faction.mapArea} · {faction.blurb}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {roster.map((p) => (
            <button
              key={p.key}
              onClick={() => setSelected(p)}
              className="flex flex-col items-center transition hover:scale-105"
              aria-label={`查看${p.name}`}
            >
              <img
                src={peopleThumb(p.img)}
                alt={p.name}
                loading="lazy"
                className="aspect-square w-full rounded-xl object-cover object-top"
                style={{ border: `2px solid ${faction.color}` }}
              />
              <span className="mt-1 text-xs font-bold" style={{ color: TK.ink }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <CharacterModal
          person={selected}
          factionColor={colorOf(selected.faction)}
          known={false}
          onClose={() => setSelected(null)}
        />
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-3"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-label="三国势力地图大图"
        >
          <img
            src={MAP_IMG}
            alt="三国势力地图"
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
    </div>
  );
}
