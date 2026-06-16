"use client";

import { motion } from "framer-motion";
import { Dot } from "./Dot";
import { EquationChip } from "./chrome";
import { BLUE, BLUE_HI, EMERALD, VB_H, VB_W } from "./geometry";
import type { ArrayScene } from "@/content/math/scene";

// 阵列 + 跳数: one beat per row. The EMERALD frame slides down to the row being added, that row's
// dots pop in, and its running total joins the skip-count trail on the right (b, 2b, …).
// Beats: 0 show · 1..rows (one per row) · rows+1 answer.
export function ArrayStage({ scene, step }: { scene: ArrayScene; step: number }) {
  const { a, b, rows, cols, product, skipCounts } = scene;
  const revealed = step <= rows ? step : rows; // rows placed so far
  const onRow = step >= 1 && step <= rows;
  const currentRow = onRow ? step - 1 : rows - 1;
  const runningTotal = revealed >= 1 ? skipCounts[revealed - 1] : 0;

  const boxH = 196;
  const topY = 52;
  const stepX = Math.min(42, 300 / Math.max(cols, 1));
  const stepY = Math.min(34, boxH / Math.max(rows, 1));
  const gridW = (cols - 1) * stepX;
  const gridH = (rows - 1) * stepY;
  const startX = 184 - gridW / 2;
  const startY = topY + (boxH - gridH) / 2;
  const dotR = Math.max(7, Math.min(13, Math.min(stepX, stepY) * 0.34));
  const labelX = startX + gridW + 40;
  const rowY = (r: number) => startY + r * stepY;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="阵列乘法动画">
      {/* the frame that boxes the row currently being added, sliding down row by row */}
      <motion.rect
        rx={14}
        width={gridW + 2 * dotR + 16}
        height={2 * dotR + 14}
        fill="none"
        stroke={EMERALD}
        strokeWidth={3}
        initial={false}
        animate={{
          x: startX - dotR - 8,
          y: rowY(Math.max(currentRow, 0)) - dotR - 7,
          opacity: onRow ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 24 }}
      />

      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <Dot
            key={`${r}-${c}`}
            to={{ x: startX + c * stepX, y: rowY(r) }}
            fill={BLUE}
            highlight={BLUE_HI}
            radius={dotR}
            delay={c * 0.05}
            gone={r >= revealed}
          />
        )),
      )}

      {/* skip-count trail: each placed row contributes its running total */}
      {skipCounts.map((total, r) => (
        <motion.text
          key={r}
          x={labelX}
          y={rowY(r)}
          textAnchor="start"
          dominantBaseline="central"
          fontWeight={900}
          fill={EMERALD}
          initial={false}
          animate={{
            opacity: r < revealed ? 1 : 0,
            x: r < revealed ? labelX : labelX - 10,
            fontSize: onRow && r === currentRow ? 25 : 20,
          }}
          transition={{ duration: 0.3 }}
        >
          {total}
        </motion.text>
      ))}

      <EquationChip
        text={step > rows ? `${a} × ${b} = ${product}` : onRow ? `一共 ${runningTotal}` : `${a} × ${b} = ?`}
      />
    </svg>
  );
}
