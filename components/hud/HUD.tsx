"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGameStore } from "@/store/gameStore";
import { VoicePicker } from "@/components/speech/VoicePicker";
import { GradeSwitcher } from "@/components/games/grades/GradeSwitcher";
import { resolveChildGrade } from "@/lib/grades";

export function HUD() {
  const router = useRouter();
  const pathname = usePathname();
  const child = useGameStore((s) => s.activeChild);
  const activeGrade = useGameStore((s) => s.activeGrade);
  const setActiveGrade = useGameStore((s) => s.setActiveGrade);
  const [voiceOpen, setVoiceOpen] = useState(false);
  if (!child) return null;

  // The grade control belongs on the learning surfaces (world map + a module) where grade
  // actually drives the content; elsewhere (story/shop/theater) it has no effect.
  const childGrade = resolveChildGrade(child);
  const grade = activeGrade ?? childGrade;
  const showGrade = pathname === "/world" || pathname.startsWith("/play/");

  return (
    <>
      <div className="fixed top-[calc(env(safe-area-inset-top)_+_0.75rem)] left-[calc(env(safe-area-inset-left)_+_0.75rem)] right-[calc(env(safe-area-inset-right)_+_0.75rem)] z-30 flex items-center justify-between gap-2 pointer-events-none">
        <button
          onClick={() => router.push("/child-select")}
          aria-label={`${child.name} 的档案`}
          className="pointer-events-auto flex min-w-0 items-center gap-2 bg-white/85 backdrop-blur px-3 py-2 rounded-2xl shadow-lg ring-1 ring-white/40 hover:bg-white"
        >
          <span className="text-2xl shrink-0">{child.avatar}</span>
          <div className="min-w-0 text-left">
            <div className="truncate text-sm font-bold text-slate-700 leading-tight">{child.name}</div>
            <div className="text-[10px] text-slate-500 leading-tight">Lv.{child.fairyLevel}</div>
          </div>
        </button>

        <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          {showGrade && (
            <GradeSwitcher childGrade={childGrade} value={grade} onChange={setActiveGrade} />
          )}
          <div className="flex items-center gap-1 sm:gap-2 bg-white/85 backdrop-blur px-2.5 sm:px-4 py-2 rounded-2xl shadow-lg ring-1 ring-white/40">
            <Stat icon="⭐" value={child.totalStars} color="text-amber-500" />
            <Sep />
            <Stat icon="❤️" value={child.hearts} color="text-rose-500" />
            <Sep />
            <Stat icon="🔥" value={child.streakDays} color="text-orange-500" />
            <Sep />
            <button
              onClick={() => setVoiceOpen(true)}
              aria-label="选择精灵声音"
              className="text-base leading-none transition hover:scale-110 sm:text-lg"
            >
              🔊
            </button>
          </div>
        </div>
      </div>

      {voiceOpen && <VoicePicker onClose={() => setVoiceOpen(false)} />}
    </>
  );
}

function Stat({ icon, value, color }: { icon: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <span className="text-base leading-none sm:text-lg">{icon}</span>
      <span className={`text-sm font-bold sm:text-base ${color}`}>{value}</span>
    </div>
  );
}

function Sep() {
  return <span className="hidden sm:block w-px h-5 bg-slate-200" />;
}
