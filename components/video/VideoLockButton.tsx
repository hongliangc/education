import { LockIcon } from "@/components/video/icons";

interface VideoLockButtonProps {
  visible: boolean;
  locked: boolean;
  onToggle: () => void;
}

// 锁屏开关（参考腾讯全屏），位于左侧中部：全屏且控件可见时显示上锁；锁定后常驻解锁。
export function VideoLockButton({ visible, locked, onToggle }: VideoLockButtonProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={locked ? "解锁屏幕" : "锁屏"}
      className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-white/25 backdrop-blur transition hover:bg-black/60"
    >
      <LockIcon className="h-5 w-5" />
    </button>
  );
}
