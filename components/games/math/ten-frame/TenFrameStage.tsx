"use client";

import type { TenFrameScene } from "@/content/math/scene";
import { BreakTenStage } from "./BreakTenStage";
import { MakeTenStage } from "./MakeTenStage";

// Renders the right ten-frame storyboard for the current beat. The playback controller
// (MathScene) owns `step`; this is the pure picture for that beat.
export function TenFrameStage({ scene, step }: { scene: TenFrameScene; step: number }) {
  if (scene.kind === "break-ten-sub") return <BreakTenStage scene={scene} step={step} />;
  return <MakeTenStage scene={scene} step={step} />;
}
