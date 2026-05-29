"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";

export function HUD() {
  const router = useRouter();
  const child = useGameStore((s) => s.activeChild);
  if (!child) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
      <button
        onClick={() => router.push("/child-select")}
        aria-label={`${child.name} 的档案`}
        className="pointer-events-auto flex items-center gap-2 bg-white/85 backdrop-blur px-3 py-2 rounded-2xl shadow-lg ring-1 ring-white/40 hover:bg-white"
      >
        <span className="text-2xl">{child.avatar}</span>
        <div className="text-left">
          <div className="text-sm font-bold text-slate-700 leading-tight">{child.name}</div>
          <div className="text-[10px] text-slate-500 leading-tight">Lv.{child.fairyLevel}</div>
        </div>
      </button>

      <div className="pointer-events-auto flex items-center gap-2 bg-white/85 backdrop-blur px-4 py-2 rounded-2xl shadow-lg ring-1 ring-white/40">
        <Stat icon="⭐" value={child.totalStars} color="text-amber-500" />
        <Sep />
        <Stat icon="❤️" value={child.hearts} color="text-rose-500" />
        <Sep />
        <Stat icon="🔥" value={child.streakDays} color="text-orange-500" />
      </div>
    </div>
  );
}

function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-lg leading-none">{icon}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function Sep() {
  return <span className="w-px h-5 bg-slate-200" />;
}
