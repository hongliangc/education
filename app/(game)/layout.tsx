import { CloudBG } from "@/components/CloudBG";
import { HUD } from "@/components/hud/HUD";

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CloudBG />
      <HUD />
      {/* 把内容整体下移一个安全区高度，配合 HUD 的 safe-area 偏移，避免刘海/灵动岛下
          fixed HUD 与各页 pt-20 内容重叠（非刘海设备 inset 为 0，等同原行为）。 */}
      <div className="pt-[env(safe-area-inset-top)]">{children}</div>
    </>
  );
}
