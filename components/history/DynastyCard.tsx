// components/history/DynastyCard.tsx
// 历史长卷里的单张朝代封面卡（封面/占位 + 悬停金光 + 进入角标 + 题注）。
"use client";
import { useState, type CSSProperties } from "react";
import type { DynastyItem } from "@/content/history/dynastyTimeline";

const BRUSH = "var(--font-history)";
const SERIF = "var(--font-history)";
const CARD_W = 320;
const CARD_H = 440;

export function DynastyCard({
  item,
  isMobile,
  index,
  onSelect,
}: {
  item: DynastyItem;
  isMobile: boolean;
  index: number;
  onSelect: (item: DynastyItem) => void;
}) {
  const [hover, setHover] = useState(false);
  const delay = `${(0.7 + Math.min(index, 26) * 0.045).toFixed(2)}s`;

  const cardStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    width: isMobile ? "100%" : `${CARD_W}px`,
    height: isMobile ? undefined : `${CARD_H}px`,
    borderRadius: "8px",
    overflow: "hidden",
    border: "1.5px solid #c89b3c",
    background: "#241509",
    cursor: "pointer",
    transition: "transform .25s ease, box-shadow .25s ease",
    animation: "cardRise .6s cubic-bezier(.2,.7,.2,1) both",
    animationDelay: delay,
    zIndex: hover ? 5 : undefined,
    transform: hover ? "translateY(-8px) scale(1.045)" : undefined,
    boxShadow: hover
      ? "0 16px 34px rgba(0,0,0,.55), 0 0 0 2px #f0d488, 0 0 24px rgba(232,196,90,.55)"
      : "0 4px 12px rgba(0,0,0,.4)",
  };

  const mediaStyle: CSSProperties = {
    position: "relative",
    flex: "1 1 auto",
    minHeight: isMobile ? "168px" : 0,
    overflow: "hidden",
  };
  const imgStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top center",
    display: "block",
  };
  const enterStyle: CSSProperties = {
    position: "absolute",
    top: "8px",
    right: "8px",
    padding: "3px 9px",
    borderRadius: "20px",
    background: "rgba(122,42,30,.92)",
    color: "#f6d98a",
    fontFamily: SERIF,
    fontSize: "11px",
    border: "1px solid rgba(232,196,90,.7)",
    opacity: hover ? 1 : 0,
    transform: hover ? "none" : "translateY(-4px)",
    transition: "opacity .2s ease, transform .2s ease",
    pointerEvents: "none",
  };
  const captionStyle: CSSProperties = {
    flex: "0 0 auto",
    display: "flex",
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: "8px",
    alignItems: "baseline",
    justifyContent: "center",
    overflow: "hidden",
    padding: isMobile ? "6px 8px" : "8px 10px",
    background: "linear-gradient(180deg,#2e1810,#180c05)",
    borderTop: "1px solid rgba(200,155,60,.5)",
  };

  return (
    <div
      style={cardStyle}
      onClick={() => onSelect(item)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      role="button"
      aria-label={`进入${item.name}`}
    >
      <div style={mediaStyle}>
        {item.cover ? (
          <img src={item.cover} alt={item.name} loading="lazy" style={imgStyle} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              background: "linear-gradient(160deg,#6e2a1e,#3c160e)",
            }}
          >
            <div
              style={{
                fontFamily: BRUSH,
                fontSize: `${item.name.length >= 5 ? (isMobile ? 18 : 22) : isMobile ? 26 : 36}px`,
                color: "#ecc457",
                letterSpacing: "3px",
                textAlign: "center",
                lineHeight: 1.15,
                padding: "0 6px",
                textShadow: "0 2px 6px rgba(0,0,0,.5)",
              }}
            >
              {item.name}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: "11px", color: "rgba(245,230,200,.55)", letterSpacing: "2px" }}>
              待补封面
            </div>
          </div>
        )}
        <div style={enterStyle}>{item.active ? "进入 →" : "敬请期待"}</div>
      </div>
      <div style={captionStyle}>
        <span style={{ fontFamily: BRUSH, fontSize: isMobile ? "19px" : "22px", color: "#f1d488", lineHeight: 1.1, letterSpacing: "2px", whiteSpace: "nowrap" }}>
          {item.name}
        </span>
        <span style={{ fontFamily: SERIF, fontSize: isMobile ? "11px" : "12.5px", color: "#e0bd76", letterSpacing: ".3px", opacity: 0.9, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.time}
        </span>
      </div>
    </div>
  );
}
