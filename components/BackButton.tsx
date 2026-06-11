"use client";

// Shared "back to the previous screen" control used across every game screen,
// so each page exposes the same clearly-sized affordance to return one level up.
export function BackButton({
  label,
  onClick,
  className = "",
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`inline-flex items-center gap-1 rounded-full bg-white/80 px-4 py-2 text-base font-bold text-slate-700 shadow ring-1 ring-white transition hover:scale-105 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 ${className}`}
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
