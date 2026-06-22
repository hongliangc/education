import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 诊断专用：客户端把首段播放各段耗时/字节 beacon 到这里，统一打进服务端 `[tts-perf]` 日志，
// 与 `[tts-stream]` 的 `[tts-timing]`（同 rid）拼出 PC vs iOS 全链路。仅 console.log，不落库。
// sendBeacon 默认 text/plain，直接读 text 原样打印即可。
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const raw = await req.text().catch(() => "");
  console.log("[tts-perf]", raw);
  return new Response(null, { status: 204 });
}
