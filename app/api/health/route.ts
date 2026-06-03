import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveFairyProvider } from "@/lib/ai/gateway";

// 健康检查（roadmap B6）：探测数据库连通性 + 报告当前 AI provider。
// MLK 未使用 Redis，故不检查 Redis。db 是硬性健康门槛；
// aiProvider="mock" 表示未配 key，不算故障。
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  let database = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    database = true;
  } catch (e) {
    console.error("[health] db check failed:", e);
  }

  const ok = database;
  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      checks: {
        database,
        aiProvider: resolveFairyProvider(), // "deepseek" | "claude" | "mock"
      },
      ts: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
