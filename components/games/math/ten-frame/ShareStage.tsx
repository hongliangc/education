"use client";

import { motion } from "framer-motion";
import { Dot } from "./Dot";
import { EquationChip } from "./chrome";
import { EMERALD, GOLD, GOLD_HI, VB_H, VB_W } from "./geometry";
import type { ShareScene } from "@/content/math/scene";

const PILE_Y = 64;
// Baskets sit high enough that the per-basket count (BASKET_BOTTOM + 22) clears the equation chip
// at the foot of the stage (≈ y 314).
const BASKET_TOP = 116;
const BASKET_BOTTOM = 244;

// 平均分: one beat per dealing round. Each round drops one counter into every basket (round index =
// the dot's slot in its basket), so the shares grow evenly and the per-basket count ticks up.
// Beats: 0 show (all in the pile) · 1..per (one round each) · per+1 answer.
export function ShareStage({ scene, step }: { scene: ShareScene; step: number }) {
  const { a, b, total, baskets, per } = scene;
  const roundsDone = step <= per ? step : per;

  const bw = Math.min(116, (VB_W - 32) / baskets);
  const bx0 = (VB_W - bw * baskets) / 2;
  const basketCenterX = (i: number) => bx0 + bw * (i + 0.5);
  const dotR = Math.max(7, Math.min(12, bw * 0.16));

  // A counter's resting place inside its basket; `slot` is the round it was dealt in.
  const twoCols = per > 4;
  const dotInBasket = (basket: number, slot: number) => {
    const cols = twoCols ? 2 : 1;
    const col = twoCols ? slot % 2 : 0;
    const row = twoCols ? Math.floor(slot / 2) : slot;
    const cx = basketCenterX(basket) + (col - (cols - 1) / 2) * (dotR * 2 + 6);
    const cy = BASKET_BOTTOM - 14 - row * (dotR * 2 + 2);
    return { x: cx, y: cy };
  };

  const pileSpacing = Math.min(34, (VB_W - 80) / Math.max(total, 1));
  const pileW = (total - 1) * pileSpacing;
  const pilePos = (k: number) => ({ x: VB_W / 2 - pileW / 2 + k * pileSpacing, y: PILE_Y });

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="平均分除法动画">
      {Array.from({ length: baskets }, (_, i) => {
        const cx = basketCenterX(i);
        return (
          <g key={`bk${i}`}>
            <path
              d={`M ${cx - bw * 0.36} ${BASKET_TOP} L ${cx + bw * 0.36} ${BASKET_TOP} L ${cx + bw * 0.3} ${BASKET_BOTTOM} L ${cx - bw * 0.3} ${BASKET_BOTTOM} Z`}
              fill="#fff7ed"
              stroke="#fdba74"
              strokeWidth={3}
            />
            <motion.text
              x={cx}
              y={BASKET_BOTTOM + 22}
              textAnchor="middle"
              fontSize={22}
              fontWeight={900}
              fill={EMERALD}
              initial={false}
              animate={{ opacity: roundsDone >= 1 ? 1 : 0 }}
              transition={{ duration: 0.25 }}
            >
              {roundsDone}
            </motion.text>
          </g>
        );
      })}

      {Array.from({ length: total }, (_, k) => {
        const round = Math.floor(k / baskets); // which round deals this counter
        const basket = k % baskets;
        const dealt = round < roundsDone;
        const to = dealt ? dotInBasket(basket, round) : pilePos(k);
        return (
          <Dot key={k} to={to} fill={GOLD} highlight={GOLD_HI} radius={dotR} delay={dealt ? basket * 0.08 : 0} />
        );
      })}

      <EquationChip
        text={step > per ? `${a} ÷ ${b} = ${per}` : roundsDone >= 1 ? `每篮 ${roundsDone} 个` : `${a} ÷ ${b} = ?`}
      />
    </svg>
  );
}
