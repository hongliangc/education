import { GameStoreGate } from "@/components/GameStoreGate";
import { KingdomBG } from "@/components/KingdomBG";
import { HUD } from "@/components/hud/HUD";
import { FairyGuideProvider } from "@/components/fairy/FairyGuideProvider";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <KingdomBG />
      <GameStoreGate>
        <HUD />
        <FairyGuideProvider>
          {/* 把内容整体下移一个安全区高度，配合 HUD 的 safe-area 偏移，避免刘海/灵动岛下
              fixed HUD 与各页 pt-20 内容重叠（非刘海设备 inset 为 0，等同原行为）。 */}
          <div className="relative z-10 pt-[env(safe-area-inset-top)]">{children}</div>
        </FairyGuideProvider>
      </GameStoreGate>
    </>
  );
}
