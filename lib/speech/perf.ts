// 客户端 TTS 首段性能埋点（诊断用，可整文件删除）：测「从发起到首字节/起播/首个有声样本」各段 ms
// + 收到字节数，beacon 回服务端 `[tts-perf]` 日志，与服务端 `[tts-timing]`（同 rid）拼出 PC vs iOS 全链路。
// iOS Chrome 控制台无法远程查看，所以统一打到服务端日志比对。
// 默认关闭，零开销；`?ttsperf=1` 开启并记住（localStorage，跨页有效），`?ttsperf=0` 关闭。

let cached: boolean | null = null;

export function perfEnabled(): boolean {
  if (cached != null) return cached;
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(location.search).get("ttsperf");
    if (q === "1") localStorage.setItem("ttsperf", "1");
    else if (q === "0") localStorage.removeItem("ttsperf");
    cached = localStorage.getItem("ttsperf") === "1";
  } catch {
    cached = false;
  }
  return cached;
}

export interface PerfMarks {
  rid: string;
  path: "mse" | "native";
  dev: string;
  t0: number;
  marks: Record<string, number>;
  bytes: number; // 收到总字节（MSE 自数；native 取流不可见 → sendPerf 时从 Resource Timing 补）
  sent: boolean;
}

export function newRid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function detectDev(): string {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "pc";
}

export function startMarks(rid: string, path: "mse" | "native"): PerfMarks {
  return { rid, path, dev: detectDev(), t0: Date.now(), marks: {}, bytes: 0, sent: false };
}

export function mark(p: PerfMarks | null, name: string): void {
  if (!p) return;
  if (p.marks[name] == null) p.marks[name] = Date.now() - p.t0;
}

// 一轮问答的端到端耗时上报（提交问题→听到声音的总等待及各段：STT / LLM / 播放）。
// 由 FairyChat 在「首个有声样本」时调用，与服务端 [fairy-chat]/[tts-timing] 互相印证。仅 ?ttsperf=1 时上报。
export function beaconTurn(marks: Record<string, number>): void {
  if (!perfEnabled()) return;
  const body = JSON.stringify({ kind: "turn", dev: detectDev(), ...marks });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon)
      navigator.sendBeacon("/api/speech/perf", body);
    else void fetch("/api/speech/perf", { method: "POST", body, keepalive: true });
  } catch {
    /* ignore */
  }
}

// 一次上报（endNow / stop 都调，sent 去重）。native 路径没有手动字节计数 → 从 Resource Timing
// 按绝对 URL 找该次请求，补 encodedBodySize（总字节）与 responseStart（首字节相对发起，TTFB）。
export function sendPerf(p: PerfMarks | null, fullUrl: string): void {
  if (!p || p.sent) return;
  p.sent = true;
  try {
    const abs = new URL(fullUrl, location.origin).href;
    const e = performance
      .getEntriesByType("resource")
      .find((r) => r.name === abs) as PerformanceResourceTiming | undefined;
    if (e) {
      if (!p.bytes && e.encodedBodySize) p.bytes = e.encodedBodySize;
      if (p.marks.ttfb == null && e.responseStart > 0)
        p.marks.ttfb = Math.round(e.responseStart - e.startTime);
    }
  } catch {
    /* ignore */
  }
  const body = JSON.stringify({ rid: p.rid, dev: p.dev, path: p.path, bytes: p.bytes, ...p.marks });
  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon)
      navigator.sendBeacon("/api/speech/perf", body);
    else void fetch("/api/speech/perf", { method: "POST", body, keepalive: true });
  } catch {
    /* ignore */
  }
}
