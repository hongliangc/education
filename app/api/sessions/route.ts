import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const VALID_MODULES = ["WRITING", "ALPHABET", "WORDS", "MATH", "STORY", "LIFE"] as const;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const childId = String(body.childId ?? "");
  const module = String(body.module ?? "");
  const score = Math.max(0, Math.floor(Number(body.score) || 0));
  const totalQ = Math.max(0, Math.floor(Number(body.totalQ) || 0));
  const correctQ = Math.max(0, Math.floor(Number(body.correctQ) || 0));
  const durationSec = Math.max(0, Math.floor(Number(body.durationSec) || 0));
  const starsEarned = Math.max(0, Math.floor(Number(body.starsEarned) || 0));

  if (!childId || !(VALID_MODULES as readonly string[]).includes(module)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // 校验 child 属于当前 parent
  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  // 写入 session
  const created = await prisma.gameSession.create({
    data: {
      childId,
      module,
      score,
      totalQ,
      correctQ,
      durationSec,
      starsEarned,
    },
  });

  // 增加 child 总星数
  await prisma.child.update({
    where: { id: childId },
    data: {
      totalStars: { increment: starsEarned },
      lastLoginDate: new Date(),
    },
  });

  // 更新进度（mastery 取最近 5 次 correctRate 平均）
  const recent = await prisma.gameSession.findMany({
    where: { childId, module },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const acc =
    recent.reduce(
      (sum, s) => sum + (s.totalQ > 0 ? s.correctQ / s.totalQ : 0),
      0,
    ) / Math.max(1, recent.length);
  const masteryPct = Math.round(acc * 100);
  const totalStarsOnModule = await prisma.gameSession.aggregate({
    where: { childId, module },
    _sum: { starsEarned: true },
  });

  await prisma.learningProgress.upsert({
    where: { childId_module: { childId, module } },
    create: {
      childId,
      module,
      stars: totalStarsOnModule._sum.starsEarned ?? 0,
      masteryPct,
    },
    update: {
      stars: totalStarsOnModule._sum.starsEarned ?? 0,
      masteryPct,
    },
  });

  return NextResponse.json({ id: created.id, masteryPct });
}
