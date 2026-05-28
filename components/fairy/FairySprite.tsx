"use client";

export type FairyMood = "happy" | "thinking" | "excited" | "surprised";

export function FairySprite({
  mood = "happy",
  size = 120,
  animate = true,
}: {
  mood?: FairyMood;
  size?: number;
  animate?: boolean;
}) {
  const eyeRy = mood === "surprised" ? 6 : 3;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      className={animate ? "anim-float" : ""}
    >
      {/* 光晕 */}
      <circle cx="60" cy="60" r="55" fill="url(#aura)" opacity="0.4" />

      {/* 翅膀 */}
      <g transform="translate(60 55)">
        <ellipse
          cx="-22"
          cy="-6"
          rx="18"
          ry="26"
          fill="#fce7f3"
          opacity="0.85"
          transform="rotate(-20)"
        />
        <ellipse
          cx="22"
          cy="-6"
          rx="18"
          ry="26"
          fill="#fce7f3"
          opacity="0.85"
          transform="rotate(20)"
        />
        <ellipse
          cx="-18"
          cy="6"
          rx="14"
          ry="20"
          fill="#fbcfe8"
          opacity="0.9"
          transform="rotate(-30)"
        />
        <ellipse
          cx="18"
          cy="6"
          rx="14"
          ry="20"
          fill="#fbcfe8"
          opacity="0.9"
          transform="rotate(30)"
        />
      </g>

      {/* 身体（裙子） */}
      <path d="M48 78 L60 60 L72 78 L70 96 L50 96 Z" fill="#f472b6" />
      <ellipse cx="60" cy="80" rx="14" ry="4" fill="#fda4af" />

      {/* 头 */}
      <circle cx="60" cy="50" r="14" fill="#fef3c7" />
      {/* 头发 */}
      <path
        d="M46 50 Q40 35 60 32 Q80 35 74 50 Q70 42 60 42 Q50 42 46 50 Z"
        fill="#fcd34d"
      />
      {/* 眼睛 */}
      <ellipse cx="55" cy="50" rx="2" ry={eyeRy} fill="#1f2937" />
      <ellipse cx="65" cy="50" rx="2" ry={eyeRy} fill="#1f2937" />
      {/* 嘴 */}
      {mood === "excited" ? (
        <ellipse cx="60" cy="56" rx="3" ry="2" fill="#1f2937" />
      ) : mood === "thinking" ? (
        <line x1="58" y1="56" x2="62" y2="56" stroke="#1f2937" strokeWidth="1.5" />
      ) : (
        <path
          d="M55 55 Q60 59 65 55"
          stroke="#1f2937"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {/* 腮红 */}
      <circle cx="52" cy="55" r="1.6" fill="#fca5a5" opacity="0.75" />
      <circle cx="68" cy="55" r="1.6" fill="#fca5a5" opacity="0.75" />

      {/* 皇冠 */}
      <path d="M52 36 L56 30 L60 34 L64 30 L68 36 Z" fill="#fbbf24" />
      <circle cx="56" cy="32" r="1" fill="#ef4444" />
      <circle cx="60" cy="36" r="1" fill="#22c55e" />
      <circle cx="64" cy="32" r="1" fill="#3b82f6" />

      {/* 魔法棒 */}
      <line x1="74" y1="80" x2="92" y2="62" stroke="#9ca3af" strokeWidth="2" />
      <text x="86" y="60" fontSize="14" fill="#fbbf24">
        ✦
      </text>

      <defs>
        <radialGradient id="aura">
          <stop offset="0%" stopColor="#fde68a" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
