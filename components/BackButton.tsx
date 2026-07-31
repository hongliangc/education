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
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/90 px-5 py-2.5 text-lg font-black text-slate-700 shadow-md ring-2 ring-amber-200/80 transition hover:scale-105 active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white ${className}`}
    >
      <span aria-hidden>←</span>
      {label}
    </button>
  );
}
