// app/api/lessons/[childId]/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isGrade } from "@/lib/grades";
import { getLessonProgress, upsertLessonProgress } from "@/lib/services/lessons";

async function ownedChild(childId: string, parentId: string) {
  return prisma.child.findFirst({ where: { id: childId, parentId } });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId } = await params;
  const child = await ownedChild(childId, session.user.id);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const module = searchParams.get("module") ?? "";
  const grade = searchParams.get("grade") ?? "";
  if (!module || !isGrade(grade)) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const progress = await getLessonProgress(childId, module, grade);
  return NextResponse.json({ progress });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ childId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { childId } = await params;
  const child = await ownedChild(childId, session.user.id);
  if (!child) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const module = String(body.module ?? "");
  const grade = String(body.grade ?? "");
  const lessonKey = String(body.lessonKey ?? "");
  const stars = Math.max(0, Math.floor(Number(body.stars) || 0));
  const masteryPct = Math.max(0, Math.floor(Number(body.masteryPct) || 0));
  if (!module || !lessonKey || !isGrade(grade)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  await upsertLessonProgress({ childId, module, grade, lessonKey, stars, masteryPct });
  return NextResponse.json({ ok: true });
}
