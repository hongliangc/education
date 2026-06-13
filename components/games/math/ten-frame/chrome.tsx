"use client";

import { motion } from "framer-motion";
import {
  CELL,
  COLS,
  FRAME_H,
  FRAME_W,
  FX,
  FY,
  ROWS,
  VB_H,
  VB_W,
  cellCenter,
} from "./geometry";

// Shared SVG chrome for both ten-frame stages: the empty frame, its glow, the headline badge
// above it, and the running equation chip at the foot of the stage.

// The 10 empty cells of the ten-frame.
export function FrameCells() {
  return (
    <>
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = cellCenter(i);
        return (
          <rect
            key={i}
            x={c.x - CELL / 2}
            y={c.y - CELL / 2}
            width={CELL}
            height={CELL}
            rx={12}
            fill="#fffdf6"
            stroke="#e7d8b5"
            strokeWidth={2}
          />
        );
      })}
    </>
  );
}

// Colored halo around the frame to spotlight a milestone (ten made / ten broken / answer formed).
export function FrameGlow({ show, color }: { show: boolean; color: string }) {
  return (
    <motion.rect
      x={FX - 8}
      y={FY - 8}
      width={FRAME_W + 16}
      height={FRAME_H + 16}
      rx={20}
      fill="none"
      stroke={color}
      strokeWidth={5}
      initial={false}
      animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.96 }}
      transition={{ duration: 0.4 }}
      style={{ transformOrigin: `${FX + FRAME_W / 2}px ${FY + FRAME_H / 2}px` }}
    />
  );
}

// Headline above the frame ("满十啦 = 10", "拿走 5", …). NOTE: animate.y is a transform delta on
// top of the y attribute, so the resting value must be 0 (not FY-…) or the text drifts onto the
// dots — the bug we fixed once already.
export function FrameBadge({ show, text, color }: { show: boolean; text: string; color: string }) {
  return (
    <motion.text
      x={FX + FRAME_W / 2}
      y={FY - 26}
      textAnchor="middle"
      fontSize={30}
      fontWeight={900}
      fill={color}
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 10 }}
      transition={{ duration: 0.35 }}
    >
      {text}
    </motion.text>
  );
}

// Running equation under the stage, updated per beat by the stage.
export function EquationChip({ text }: { text: string }) {
  return (
    <text x={VB_W / 2} y={VB_H - 6} textAnchor="middle" fontSize={24} fontWeight={900} fill="#475569">
      {text}
    </text>
  );
}
