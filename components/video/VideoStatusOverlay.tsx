import { Btn } from "@/components/Btn";

interface VideoStatusOverlayProps {
  loading: boolean;
  error?: string;
  onBack: () => void;
}

/** 加载中 / 出错 / 未选片时的居中提示浮层。 */
export function VideoStatusOverlay({ loading, error, onBack }: VideoStatusOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="max-w-sm rounded-3xl bg-slate-900/80 p-6 text-center text-white shadow-2xl ring-1 ring-white/10">
        <div className="mb-3 text-5xl">{error ? "☁️" : "🎬"}</div>
        <p className="mb-4 text-lg font-bold">
          {error ?? (loading ? "视频正在准备..." : "选一个视频开始播放")}
        </p>
        {error && (
          <Btn variant="secondary" onClick={onBack}>
            返回片库
          </Btn>
        )}
      </div>
    </div>
  );
}
