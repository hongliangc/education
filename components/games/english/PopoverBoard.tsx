"use client";

import { useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";

// 点字母 / 点音标 → 在它所在的位置浮出一块「毛玻璃」详情卡（参考实拍 "All About Bb" 卡片墙的悬浮感）。
// 这是通用外壳，字母表和音标表共用：
//   • 容器相对定位，事件委托给带 data-tile-index 的瓦片；
//   • 详情卡 absolute 钉在被点瓦片旁边（下半屏的瓦片向上弹），并夹在容器内不溢出；
//   • 再点同一个瓦片 / 点空白处 → 收起，回到整体预览。
// 卡片内容（含 🎤 跟读）由调用方通过 renderPopover 提供，卡片用 stopPropagation 把内部点击和容器隔开。
const GAP = 10; // 瓦片与详情卡之间的间距(px)
const EDGE = 8; // 详情卡距容器左右边的最小留白(px)

type Anchor = { left: number; vertical: "top" | "bottom"; offset: number };

export function PopoverBoard({
  openIndex,
  onOpenChange,
  popoverWidth = 288,
  className,
  children,
  renderPopover,
}: {
  openIndex: number | null;
  onOpenChange: (index: number | null) => void;
  popoverWidth?: number;
  className?: string;
  children: (openIndex: number | null) => ReactNode;
  renderPopover: (index: number) => ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);

  const close = () => {
    onOpenChange(null);
    setAnchor(null);
  };

  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const tile = (e.target as Element).closest("[data-tile-index]");
    if (!tile || !container.contains(tile)) {
      if (openIndex != null) close(); // 点空白处收起
      return;
    }
    const index = Number(tile.getAttribute("data-tile-index"));
    if (index === openIndex) {
      close(); // 再点同一个收起
      return;
    }
    const cRect = container.getBoundingClientRect();
    const tRect = tile.getBoundingClientRect();
    const tileCenterX = tRect.left - cRect.left + tRect.width / 2;
    const left = Math.max(EDGE, Math.min(tileCenterX - popoverWidth / 2, cRect.width - popoverWidth - EDGE));
    const tileTop = tRect.top - cRect.top;
    const tileBottom = tRect.bottom - cRect.top;
    const openUp = tileTop > cRect.height / 2; // 下半屏的瓦片向上弹，避免卡片溢出底部
    setAnchor({
      left,
      vertical: openUp ? "bottom" : "top",
      offset: openUp ? cRect.height - tileTop + GAP : tileBottom + GAP,
    });
    onOpenChange(index);
  };

  const popoverStyle: CSSProperties = anchor
    ? { width: popoverWidth, left: anchor.left, [anchor.vertical]: anchor.offset }
    : {};

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`} onClick={handleClick}>
      {children(openIndex)}
      {openIndex != null && anchor ? (
        <div className="anim-pop-in absolute z-20" style={popoverStyle} onClick={(e) => e.stopPropagation()}>
          {renderPopover(openIndex)}
        </div>
      ) : null}
    </div>
  );
}
