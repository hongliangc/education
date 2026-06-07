import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPrismaRewardsAdapter } from "@/lib/rewards/adapter";
import { recordSessionStars } from "@/lib/rewards/service";

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

  const { created, masteryPct } = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.gameSession.create({
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

    await recordSessionStars({
      childId,
      sessionId: createdSession.id,
      starsEarned,
      ownerId: session.user.id,
      adapter: createPrismaRewardsAdapter(tx),
    });
    await tx.child.update({
      where: { id: childId },
      data: { lastLoginDate: new Date() },
    });

    // mastery 取最近 5 次答题正确率平均值。
    const recent = await tx.gameSession.findMany({
      where: { childId, module },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const accuracy =
      recent.reduce(
        (sum, item) => sum + (item.totalQ > 0 ? item.correctQ / item.totalQ : 0),
        0,
      ) / Math.max(1, recent.length);
    const nextMasteryPct = Math.round(accuracy * 100);
    const totalStarsOnModule = await tx.gameSession.aggregate({
      where: { childId, module },
      _sum: { starsEarned: true },
    });

    await tx.learningProgress.upsert({
      where: { childId_module: { childId, module } },
      create: {
        childId,
        module,
        stars: totalStarsOnModule._sum.starsEarned ?? 0,
        masteryPct: nextMasteryPct,
      },
      update: {
        stars: totalStarsOnModule._sum.starsEarned ?? 0,
        masteryPct: nextMasteryPct,
      },
    });

    return { created: createdSession, masteryPct: nextMasteryPct };
  });

  return NextResponse.json({ id: created.id, masteryPct });
}
