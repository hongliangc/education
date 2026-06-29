// 大事件时间线：背景事件信息卡 + 章节闯关事件（锁定/可挑战/已通关，可点进阅读）。
"use client";
import type { CSSProperties } from "react";
import { THREE_KINGDOMS_DETAIL, type HistEvent } from "@/content/history/three-kingdoms-detail";
import { eventStatus, type EventStatus } from "@/lib/history/threeKingdomsProgress";
import { TK } from "./theme";

const SERIF = "var(--font-history), 'Noto Serif SC', serif";

const DOT: Record<EventStatus, string> = {
  cleared: TK.gold,
  open: TK.cinnabar,
  locked: "#9a8a6a",
  info: "#8a7a55",
};
const BADGE: Record<EventStatus, { text: string; bg: string } | null> = {
  cleared: { text: "✓ 已通关", bg: TK.gold },
  open: { text: "去闯关 →", bg: TK.cinnabar },
  locked: { text: "🔒 未解锁", bg: "rgba(43,38,34,.45)" },
  info: { text: "历史背景", bg: "rgba(43,38,34,.55)" },
};

export function EventsTab({
  completedChapters,
  onPickChapter,
}: {
  completedChapters: number;
  onPickChapter: (idx: number) => void;
}) {
  return (
    <ol className="relative ml-3 border-l-2 pl-5" style={{ borderColor: TK.gold }}>
      {THREE_KINGDOMS_DETAIL.events.map((ev, i) => {
        const status = eventStatus(ev.chapterIdx, completedChapters);
        return <EventRow key={ev.key} ev={ev} status={status} index={i} onPickChapter={onPickChapter} />;
      })}
    </ol>
  );
}

function EventRow({
  ev,
  status,
  index,
  onPickChapter,
}: {
  ev: HistEvent;
  status: EventStatus;
  index: number;
  onPickChapter: (idx: number) => void;
}) {
  const locked = status === "locked";
  const clickable = (status === "open" || status === "cleared") && ev.chapterIdx !== undefined;
  const badge = BADGE[status];
  const delay = `${(0.05 + Math.min(index, 12) * 0.05).toFixed(2)}s`;

  const cardStyle: CSSProperties = {
    background: TK.parchment,
    border: `2px solid ${status === "open" ? TK.cinnabar : TK.gold}`,
    boxShadow: "0 6px 16px rgba(0,0,0,.3)",
    opacity: locked ? 0.6 : 1,
    cursor: clickable ? "pointer" : "default",
    animation: "cardRise .5s ease both",
    animationDelay: delay,
  };

  return (
    <li className="relative mb-4">
      {/* 时间线结点 */}
      <span
        className="absolute -left-[27px] top-3 h-4 w-4 rounded-full"
        style={{ background: DOT[status], border: "2px solid #fff", boxShadow: "0 0 0 2px rgba(0,0,0,.15)" }}
        aria-hidden
      />
      <div
        className="overflow-hidden rounded-2xl"
        style={cardStyle}
        role={clickable ? "button" : undefined}
        onClick={clickable ? () => onPickChapter(ev.chapterIdx!) : undefined}
        aria-label={clickable ? `阅读${ev.name}` : ev.name}
      >
        <div className="flex">
          {ev.img ? (
            <img
              src={ev.img}
              alt={ev.name}
              loading="lazy"
              className="h-24 w-28 shrink-0 object-cover sm:h-28 sm:w-36"
              style={{ filter: locked ? "grayscale(1) brightness(.6)" : undefined }}
            />
          ) : (
            <div
              className="flex h-24 w-28 shrink-0 items-center justify-center text-4xl sm:h-28 sm:w-36"
              style={{ background: "linear-gradient(160deg,#e9d7a6,#d4bb7e)" }}
              aria-hidden
            >
              {ev.emoji}
            </div>
          )}
          <div className="min-w-0 flex-1 p-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-black" style={{ color: TK.ink, fontFamily: SERIF }}>
                {ev.name}
              </span>
              {badge && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                  style={{ background: badge.bg }}
                >
                  {badge.text}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm font-bold" style={{ color: TK.goldDeep }}>{ev.kidTitle}</p>
            <p className="mt-1 line-clamp-2 text-sm" style={{ color: "rgba(43,38,34,.85)" }}>
              {ev.summary}
            </p>
          </div>
        </div>
      </div>
    </li>
  );
}
