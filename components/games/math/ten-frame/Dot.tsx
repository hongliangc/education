"use client";

import { motion } from "framer-motion";
import { R, type Pt } from "./geometry";

// A single counter. The group's x/y transform tweens it from its previous beat position to `to`,
// so changing where a Dot is told to go *is* the animation. `gone` shrinks it away (a counter
// removed from the ten in 破十法). The inner highlight circle gives it a glossy, kid-friendly look.
export function Dot({
  to,
  fill,
  highlight,
  delay = 0,
  gone = false,
}: {
  to: Pt;
  fill: string;
  highlight: string;
  delay?: number;
  gone?: boolean;
}) {
  return (
    <motion.g
      initial={{ x: to.x, y: to.y, scale: 0 }}
      animate={{ x: to.x, y: to.y, scale: gone ? 0 : 1, opacity: gone ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 22, delay }}
    >
      <circle r={R} fill={fill} />
      <circle cx={-R * 0.32} cy={-R * 0.32} r={R * 0.3} fill={highlight} opacity={0.85} />
    </motion.g>
  );
}
