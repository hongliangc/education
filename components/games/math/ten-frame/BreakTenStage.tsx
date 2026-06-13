"use client";

import { Dot } from "./Dot";
import { EquationChip, FrameBadge, FrameCells, FrameGlow } from "./chrome";
import {
  BLUE,
  BLUE_HI,
  EMERALD,
  GOLD,
  GOLD_HI,
  ORANGE,
  RED,
  VB_H,
  VB_W,
  cellCenter,
  loosePos,
} from "./geometry";
import type { BreakTenScene } from "@/content/math/scene";

// 破十法: the frame starts full (a = 10 + ones). The ones below can't cover b, so we take b out of
// the ten — the last b dots leave — then slide the loose ones up to join the fromTen survivors.
// Since the answer (fromTen + ones) is always < 10, everyone fits back inside the frame. Beats:
// 0 show · 1 borrow · 2 subtract · 3 combine · 4 answer.
export function BreakTenStage({ scene, step }: { scene: BreakTenScene; step: number }) {
  const { a, b, ones, fromTen, answer } = scene;
  const breaking = step >= 1; // frame spotlit as we open the ten
  const broken = step >= 2; // b dots have been taken out of the ten
  const combined = step >= 3; // loose ones have moved in beside the survivors

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="破十法动画">
      <FrameGlow show={breaking} color={combined ? EMERALD : ORANGE} />
      <FrameCells />

      {/* the full ten in blue. The last b (cells fromTen..9) are taken out at the subtract beat;
          the first fromTen stay put as the survivors. */}
      {Array.from({ length: 10 }, (_, i) => {
        const taken = i >= fromTen;
        return (
          <Dot
            key={`t${i}`}
            to={cellCenter(i)}
            fill={BLUE}
            highlight={BLUE_HI}
            delay={i * 0.05}
            gone={taken && broken}
          />
        );
      })}

      {/* the loose ones: wait below the frame, then slide into cells [fromTen, fromTen+ones) to
          join the survivors when we combine. */}
      {Array.from({ length: ones }, (_, j) => {
        const to = combined ? cellCenter(fromTen + j) : loosePos(j, ones, 0, false);
        const delay = combined ? j * 0.12 : j * 0.05;
        return <Dot key={`o${j}`} to={to} fill={GOLD} highlight={GOLD_HI} delay={delay} />;
      })}

      {/* take b out of the ten, then announce the recombined total */}
      <FrameBadge show={broken && !combined} text={`拿走 ${b}`} color={RED} />
      <FrameBadge show={combined} text={`合起来 = ${answer}`} color={EMERALD} />

      <EquationChip
        text={
          step >= 4
            ? `${a} − ${b} = ${answer}`
            : combined
              ? `${fromTen} + ${ones} = ?`
              : broken
                ? `10 − ${b} = ${fromTen}`
                : breaking
                  ? `( 10 + ${ones} ) − ${b}`
                  : `${a} − ${b} = ?`
        }
      />
    </svg>
  );
}
