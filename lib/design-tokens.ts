// 视觉令牌 — 移植自原型 GlobalCSS / 颜色变量 T
export const T = {
  sky1: "#bae6fd",
  sky2: "#7dd3fc",
  grass: "#86efac",
  pink: "#f9a8d4",
  rose: "#fda4af",
  yellow: "#fde68a",
  orange: "#fdba74",
  purple: "#c4b5fd",
  blue: "#93c5fd",
  green: "#86efac",
  ink: "#1f2937",
  paper: "#fff7ed",
  cream: "#fef3c7",
} as const;

export type Tone = keyof typeof T;
