// 群英谱：四阵营分组的人物卡墙 + 收集计数器 + 阵营筛选 + 详情弹窗。
"use client";
import { useMemo, useState } from "react";
import { THREE_KINGDOMS } from "@/content/storybooks/three-kingdoms";
import { THREE_KINGDOMS_DETAIL, type FactionKey, type Person } from "@/content/history/three-kingdoms-detail";
import { personCollectState, knownCount } from "@/lib/history/threeKingdomsProgress";
import { CharacterCard, type CardState } from "./CharacterCard";
import { CharacterModal } from "./CharacterModal";
import { TK } from "./theme";

const SERIF = "var(--font-history), 'Noto Serif SC', serif";
const { people, factions } = THREE_KINGDOMS_DETAIL;
const chapters = THREE_KINGDOMS.chapters;
const coreKeys = people.filter((p) => p.core).map((p) => p.key);
const factionColor = (k: FactionKey) => factions.find((f) => f.key === k)!.color;

function cardState(p: Person, completed: number): CardState {
  if (!p.core) return "gallery";
  return personCollectState(p.key, chapters, completed);
}

export function PeopleTab({ completedChapters }: { completedChapters: number }) {
  const [filter, setFilter] = useState<FactionKey | "all">("all");
  const [selected, setSelected] = useState<Person | null>(null);

  const known = useMemo(() => knownCount(coreKeys, chapters, completedChapters), [completedChapters]);
  const shown = factions.filter((f) => filter === "all" || f.key === filter);

  return (
    <div>
      {/* 计数器 + 筛选 */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-3 py-1.5 text-sm font-bold"
          style={{ background: TK.gold, color: "#fff", fontFamily: SERIF }}
        >
          群英已了解 {known} / {coreKeys.length}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...factions.map((f) => f.key)] as const).map((k) => {
            const active = filter === k;
            const label = k === "all" ? "全部" : factions.find((f) => f.key === k)!.name;
            const color = k === "all" ? TK.ink : factionColor(k);
            return (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className="rounded-full px-3 py-1.5 text-sm font-bold transition"
                style={{
                  background: active ? color : "rgba(255,255,255,.55)",
                  color: active ? "#fff" : TK.ink,
                  border: `1.5px solid ${color}`,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 分阵营卡墙 */}
      {shown.map((f) => {
        const list = people.filter((p) => p.faction === f.key);
        if (list.length === 0) return null;
        return (
          <section key={f.key} className="mb-5">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="rounded-md px-2.5 py-1 text-base font-black text-white"
                style={{ background: f.color, fontFamily: SERIF }}
              >
                {f.name}
              </span>
              <span className="text-sm" style={{ color: "rgba(43,38,34,.7)" }}>{f.blurb}</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
              {list.map((p, i) => (
                <CharacterCard
                  key={p.key}
                  person={p}
                  state={cardState(p, completedChapters)}
                  factionColor={f.color}
                  index={i}
                  onClick={() => setSelected(p)}
                />
              ))}
            </div>
          </section>
        );
      })}

      {selected && (
        <CharacterModal
          person={selected}
          factionColor={factionColor(selected.faction)}
          known={cardState(selected, completedChapters) === "known"}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
