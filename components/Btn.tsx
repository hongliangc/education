"use client";

import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "danger" | "ghost";

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-base rounded-2xl",
  lg: "px-8 py-4 text-xl rounded-3xl",
};

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-[0_6px_0_#ec4899] active:shadow-[0_2px_0_#ec4899] active:translate-y-1",
  secondary:
    "bg-gradient-to-b from-sky-400 to-sky-500 text-white shadow-[0_6px_0_#0284c7] active:shadow-[0_2px_0_#0284c7] active:translate-y-1",
  danger:
    "bg-gradient-to-b from-rose-400 to-rose-500 text-white shadow-[0_6px_0_#e11d48] active:shadow-[0_2px_0_#e11d48] active:translate-y-1",
  ghost:
    "bg-white/70 text-slate-700 ring-1 ring-slate-200 active:bg-white/90",
};

export function Btn({
  children,
  onClick,
  size = "md",
  variant = "primary",
  disabled,
  className,
  type = "button",
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  size?: Size;
  variant?: Variant;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold transition-all select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0",
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}
