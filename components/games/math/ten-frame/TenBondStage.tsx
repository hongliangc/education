"use client";

import { motion } from "framer-motion";
import { Dot } from "./Dot";
import { EquationChip, FrameCells } from "./chrome";
import { BLUE, BLUE_HI, GOLD, GOLD_HI, VB_H, VB_W, cellCenter } from "./geometry";
import type { TenBondScene } from "@/content/math/scene";

const CX = VB_W / 2;
const WHOLE_Y = 206;
const PART_Y = 270;
const PART_DX = 70;

// One node of the part-whole bond (圆圈里写数). Fades/pops in on the bond beat.
function BondNode({
  x,
  y,
  r,
  stroke,
  fill,
  value,
  show,
  delay = 0,
}: {
  x: number;
  y: number;
  r: number;
  stroke: string;
  fill: string;
  value: number;
  show: boolean;
  delay?: number;
}) {
  return (
    <motion.g
      initial={false}
      animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.6 }}
      transition={{ duration: 0.3, delay }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      <circle cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={3} />
      <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={r} fontWeight={900} fill={stroke}>
        {value}
      </text>
    </motion.g>
  );
}

// 数的组成 over a single ten-frame. Add: place a (blue) then b (gold) into the frame. Sub: fill a,
// then the last b dots leave. The bond underneath makes the part-whole relationship explicit.
// Add beats: 0 show · 1 part-a · 2 part-b · 3 bond · 4 answer.
// Sub beats: 0 show · 1 whole · 2 remove · 3 bond · 4 answer.
export function TenBondStage({ scene, step }: { scene: TenBondScene; step: number }) {
  const { op, a, b, whole, parts, answer } = scene;
  const isAdd = op === "+";
  const firstShown = step >= 1; // a (add) / whole (sub) placed
  const secondAdded = isAdd && step >= 2; // add: second part placed
  const removed = !isAdd && step >= 2; // sub: last b taken away
  const bondShown = step >= 3;

  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="w-full" role="img" aria-label="数的组成动画">
      <FrameCells />

      {isAdd ? (
        <>
          {Array.from({ length: a }, (_, i) => (
            <Dot key={`a${i}`} to={cellCenter(i)} fill={BLUE} highlight={BLUE_HI} delay={i * 0.05} gone={!firstShown} />
          ))}
          {Array.from({ length: b }, (_, j) => (
            <Dot key={`b${j}`} to={cellCenter(a + j)} fill={GOLD} highlight={GOLD_HI} delay={j * 0.08} gone={!secondAdded} />
          ))}
        </>
      ) : (
        <>
          {/* kept dots stay; removed dots appear at "whole" then leave at "remove" */}
          {Array.from({ length: answer }, (_, i) => (
            <Dot key={`k${i}`} to={cellCenter(i)} fill={BLUE} highlight={BLUE_HI} delay={i * 0.05} gone={!firstShown} />
          ))}
          {Array.from({ length: b }, (_, j) => (
            <Dot
              key={`r${j}`}
              to={cellCenter(answer + j)}
              fill={GOLD}
              highlight={GOLD_HI}
              delay={j * 0.05}
              gone={!firstShown || removed}
            />
          ))}
        </>
      )}

      {/* part-whole bond */}
      <motion.line
        x1={CX}
        y1={WHOLE_Y}
        x2={CX - PART_DX}
        y2={PART_Y}
        stroke="#cbd5e1"
        strokeWidth={3}
        initial={false}
        animate={{ opacity: bondShown ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <motion.line
        x1={CX}
        y1={WHOLE_Y}
        x2={CX + PART_DX}
        y2={PART_Y}
        stroke="#cbd5e1"
        strokeWidth={3}
        initial={false}
        animate={{ opacity: bondShown ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      <BondNode x={CX} y={WHOLE_Y} r={24} stroke={BLUE} fill="#eff6ff" value={whole} show={bondShown} />
      <BondNode x={CX - PART_DX} y={PART_Y} r={20} stroke={BLUE} fill="#eff6ff" value={parts[0]} show={bondShown} delay={0.1} />
      <BondNode x={CX + PART_DX} y={PART_Y} r={20} stroke={GOLD} fill="#fffbeb" value={parts[1]} show={bondShown} delay={0.15} />

      <EquationChip text={step >= 4 ? `${a} ${op} ${b} = ${answer}` : `${a} ${op} ${b} = ?`} />
    </svg>
  );
}
