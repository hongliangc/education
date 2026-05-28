import { CloudBG } from "@/components/CloudBG";
import { HUD } from "@/components/hud/HUD";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CloudBG />
      <HUD />
      {children}
    </>
  );
}
