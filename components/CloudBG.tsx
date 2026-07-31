"use client";

export function CloudBG() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* 云朵 */}
      <Cloud className="top-10 left-[5%] anim-float" delay={0} scale={1.2} />
      <Cloud className="top-24 right-[8%] anim-float" delay={1.2} scale={1} />
      <Cloud className="top-1/2 left-[12%] anim-float" delay={2} scale={0.9} />
      <Cloud className="bottom-1/3 right-[16%] anim-float" delay={0.6} scale={1.1} />

      {/* 闪烁星星 */}
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute text-yellow-300 anim-twinkle"
          style={{
            top: `${(i * 53) % 90}%`,
            left: `${(i * 71) % 95}%`,
            fontSize: `${10 + ((i * 7) % 12)}px`,
            animationDelay: `${(i * 0.13) % 1.6}s`,
          }}
        >
          ✦
        </span>
      ))}

      {/* 草地远景 */}
      <svg
        viewBox="0 0 1200 300"
        className="absolute bottom-0 left-0 right-0 w-full h-[24vh] opacity-90"
        preserveAspectRatio="none"
      >
        <path d="M0,200 Q300,100 600,170 T1200,180 L1200,300 L0,300 Z" fill="#86efac" />
        <path d="M0,240 Q300,180 600,220 T1200,210 L1200,300 L0,300 Z" fill="#65d987" />
      </svg>
    </div>
  );
}

function Cloud({
  className = "",
  delay = 0,
  scale = 1,
}: {
  className?: string;
  delay?: number;
  scale?: number;
}) {
  return (
    <svg
      width={120 * scale}
      height={60 * scale}
      viewBox="0 0 120 60"
      className={`absolute ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <ellipse cx="30" cy="40" rx="22" ry="18" fill="white" />
      <ellipse cx="60" cy="30" rx="26" ry="22" fill="white" />
      <ellipse cx="90" cy="42" rx="20" ry="16" fill="white" />
    </svg>
  );
}
