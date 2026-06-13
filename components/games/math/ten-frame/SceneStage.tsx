"use client";

import type { Storyboard } from "@/content/math/scene";
import { ArrayStage } from "./ArrayStage";
import { BreakTenStage } from "./BreakTenStage";
import { MakeTenStage } from "./MakeTenStage";
import { ShareStage } from "./ShareStage";
import { TenBondStage } from "./TenBondStage";

// Renders the right storyboard stage for the current beat. The playback controller (MathScene)
// owns `step`; this is the pure picture for that beat. One line per teaching method.
export function SceneStage({ scene, step }: { scene: Storyboard; step: number }) {
  switch (scene.kind) {
    case "make-ten-add":
      return <MakeTenStage scene={scene} step={step} />;
    case "break-ten-sub":
      return <BreakTenStage scene={scene} step={step} />;
    case "ten-bond":
      return <TenBondStage scene={scene} step={step} />;
    case "array-mul":
      return <ArrayStage scene={scene} step={step} />;
    case "share-div":
      return <ShareStage scene={scene} step={step} />;
  }
}
