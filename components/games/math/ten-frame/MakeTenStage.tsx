"use client";

import { motion } from "framer-motion";
import { Dot } from "./Dot";
import { EquationChip, FrameBadge, FrameCells, FrameGlow } from "./chrome";
import {
  BLUE,
  BLUE_HI,
  GOLD,
  GOLD_HI,
  LOOSE_Y,
  ORANGE,
  R,
  VB_H,
  VB_W,
  cellCenter,
  loosePos,
} from "./geometry";
import type { MakeTenScene } from "@/content/math/scene";

// 凑十法: a blue dots sit in the frame; b gold dots wait below. We split b into `need` (to top the
// frame up to 10) and `rest`; the `need` group hops into the frame at the make-ten beat. Beats:
// 0 show · 1 split · 2 make-ten · 3 carry · 4 answer.
export function MakeTenStage({ scene, step }: { scene: MakeTenScene; step: number }) {
  const { a, b, need, rest, answer } = scene;
  const tenMade = step >= 2; // frame now holds a full 10
  const splitShown = step >= 1; // b is decomposed into need + rest

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="凑十法动画">
      <FrameGlow show={tenMade} color={GOLD} />
      <FrameCells />

      {/* dashed trays around the two parts of b once it is split */}
      {[
        { from: 0, to: need, label: need, show: splitShown && !tenMade, tint: GOLD },
        { from: need, to: b, label: rest, show: splitShown, tint: ORANGE },
      ].map((g, gi) => {
        if (g.to <= g.from || !g.show) return null;
        const left = loosePos(g.from, b, need, true).x;
        const right = loosePos(g.to - 1, b, need, true).x;
        return (
          <motion.g
            key={gi}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <rect
              x={left - R - 8}
              y={LOOSE_Y - R - 8}
              width={right - left + 2 * R + 16}
              height={2 * R + 16}
              rx={18}
              fill="none"
              stroke={g.tint}
              strokeDasharray="6 6"
              strokeWidth={2.5}
              opacity={0.8}
            />
            <text
              x={(left + right) / 2}
              y={LOOSE_Y + R + 26}
              textAnchor="middle"
              fontSize={20}
              fontWeight={800}
              fill={g.tint}
            >
              {g.label}
            </text>
          </motion.g>
        );
      })}

      {/* the a blue dots already in the frame */}
      {Array.from({ length: a }, (_, i) => (
        <Dot key={`a${i}`} to={cellCenter(i)} fill={BLUE} highlight={BLUE_HI} delay={i * 0.06} />
      ))}

      {/* the b gold dots: the first `need` hop into the frame at make-ten, the rest stay below */}
      {Array.from({ length: b }, (_, j) => {
        const belongsToTen = j < need;
        const to = belongsToTen && tenMade ? cellCenter(a + j) : loosePos(j, b, need, splitShown);
        const delay = belongsToTen && tenMade ? j * 0.14 : j * 0.04;
        return <Dot key={`b${j}`} to={to} fill={GOLD} highlight={GOLD_HI} delay={delay} />;
      })}

      <FrameBadge show={tenMade} text="满十啦 = 10" color={GOLD} />

      <EquationChip
        text={
          step >= 4
            ? `${a} + ${b} = ${answer}`
            : step >= 3
              ? `10 + ${rest} = ?`
              : step >= 1
                ? `${a} + ( ${need} + ${rest} )`
                : `${a} + ${b} = ?`
        }
      />
    </svg>
  );
}
