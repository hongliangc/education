import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createPrismaRewardsAdapter } from "@/lib/rewards/adapter";
import { recordSessionStars } from "@/lib/rewards/service";
import { resolveSessionGrade, summarizeModuleGrade } from "@/lib/grades";

const VALID_MODULES = ["WRITING", "ALPHABET", "WORDS", "MATH", "STORY", "LITERATURE", "LIFE", "HISTORY"] as const;

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

  // 解析并校验本次会话年级：缺省回落 LEGACY，超出孩子年级一级则拒绝。
  const gradeLevel = resolveSessionGrade(child, body.gradeLevel);
  if (gradeLevel === null) {
    return NextResponse.json({ error: "无效的年级" }, { status: 400 });
  }

  const { created, masteryPct } = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.gameSession.create({
      data: {
        childId,
        module,
        gradeLevel,
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

    // 按「模块 + 年级」统计：最近五次掌握度与该年级累计星星，LEGACY 与各年级互不混入。
    const moduleSessions = await tx.gameSession.findMany({
      where: { childId, module },
      orderBy: { createdAt: "desc" },
    });
    const { masteryPct: nextMasteryPct, stars } = summarizeModuleGrade(
      moduleSessions,
      gradeLevel,
    );

    await tx.learningProgress.upsert({
      where: { childId_module_gradeLevel: { childId, module, gradeLevel } },
      create: { childId, module, gradeLevel, stars, masteryPct: nextMasteryPct },
      update: { stars, masteryPct: nextMasteryPct },
    });

    return { created: createdSession, masteryPct: nextMasteryPct };
  });

  return NextResponse.json({ id: created.id, masteryPct });
}
