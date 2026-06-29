// 群英谱单卡：核心人物随阅读点亮（未遇→相识→了解），彩蛋人物作图鉴。
"use client";
import { useState, type CSSProperties } from "react";
import type { Person } from "@/content/history/three-kingdoms-detail";
import { TK, peopleThumb } from "./theme";

const BRUSH = "'Ma Shan Zheng', var(--font-history), serif";
const SERIF = "var(--font-history), 'Noto Serif SC', serif";

export type CardState = "locked" | "met" | "known" | "gallery";

const TAG: Record<Exclude<CardState, "locked">, { text: string; bg: string }> = {
  met: { text: "相识", bg: "rgba(46,139,107,.92)" },
  known: { text: "了解", bg: "rgba(201,162,75,.95)" },
  gallery: { text: "图鉴", bg: "rgba(43,38,34,.7)" },
};

export function CharacterCard({
  person,
  state,
  factionColor,
  index,
  onClick,
}: {
  person: Person;
  state: CardState;
  factionColor: string;
  index: number;
  onClick: () => void;
}) {
  const [hover, setHover] = useState(false);
  const locked = state === "locked";
  const known = state === "known";
  const ring = known ? TK.gold : factionColor;
  const delay = `${(0.05 + Math.min(index, 20) * 0.04).toFixed(2)}s`;

  const cardStyle: CSSProperties = {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    borderRadius: "12px",
    overflow: "hidden",
    border: `2px solid ${ring}`,
    background: "#241509",
    cursor: locked ? "default" : "pointer",
    transition: "transform .2s ease, box-shadow .2s ease",
    animation: "cardRise .5s cubic-bezier(.2,.7,.2,1) both",
    animationDelay: delay,
    transform: hover && !locked ? "translateY(-6px) scale(1.04)" : undefined,
    boxShadow:
      hover && !locked
        ? `0 14px 30px rgba(0,0,0,.5), 0 0 0 2px ${ring}, 0 0 18px ${ring}88`
        : known
          ? `0 4px 12px rgba(0,0,0,.4), 0 0 0 1px ${TK.gold}66`
          : "0 4px 12px rgba(0,0,0,.4)",
  };

  return (
    <div
      style={cardStyle}
      onClick={locked ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      aria-disabled={locked}
      aria-label={locked ? `${person.name}（未解锁）` : `查看${person.name}`}
    >
      <div style={{ position: "relative", aspectRatio: "4 / 5", overflow: "hidden" }}>
        <img
          src={peopleThumb(person.img)}
          alt={person.name}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            display: "block",
            filter: locked ? "grayscale(1) brightness(.4)" : undefined,
          }}
        />
        {locked && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "34px",
              background: "rgba(20,12,6,.35)",
            }}
            aria-hidden
          >
            🔒
          </div>
        )}
        {!locked && (
          <span
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              padding: "2px 8px",
              borderRadius: "20px",
              fontFamily: SERIF,
              fontSize: "11px",
              color: "#fff",
              background: TAG[state].bg,
              border: "1px solid rgba(255,255,255,.45)",
            }}
          >
            {TAG[state].text}
          </span>
        )}
        {/* 阵营角标 */}
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "6px",
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: BRUSH,
            fontSize: "14px",
            color: "#fff",
            background: factionColor,
            border: "1px solid rgba(255,255,255,.5)",
            opacity: locked ? 0.6 : 1,
          }}
          aria-hidden
        >
          {person.name && person.faction ? FACTION_GLYPH(person.faction) : ""}
        </span>
      </div>
      <div
        style={{
          padding: "7px 8px",
          background: "linear-gradient(180deg,#2e1810,#180c05)",
          borderTop: `1px solid ${ring}88`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: BRUSH,
            fontSize: "19px",
            color: locked ? "rgba(241,212,136,.5)" : "#f1d488",
            letterSpacing: "2px",
            lineHeight: 1.1,
          }}
        >
          {person.name}
        </div>
        <div
          style={{
            fontFamily: SERIF,
            fontSize: "11px",
            color: "rgba(224,189,118,.85)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {locked ? "读到相关故事即可相识" : person.role}
        </div>
      </div>
    </div>
  );
}

function FACTION_GLYPH(f: Person["faction"]): string {
  return { shu: "蜀", wei: "魏", wu: "吴", qun: "雄" }[f];
}
